import Time "mo:core/Time";
import Int "mo:core/Int";
import Order "mo:core/Order";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type SubscriptionPlan = {
    #Starter;  // ₹999, 8 photos, 1 video
    #Basic;    // ₹1999, 20 photos, 2 videos
    #Growth;   // ₹3999, 50 photos, 5 videos
    #Pro;      // ₹6999, 120 photos, 12 videos
    #Max;      // ₹9999, 250 photos, 25 videos
  };

  public type UsageData = {
    photosUsed : Nat;
    videosUsed : Nat;
    monthYear : Text;
  };

  public type SubscriptionInfo = {
    plan : ?SubscriptionPlan;  // null = free tier (1 photo)
    photosUsed : Nat;
    videosUsed : Nat;
    photoLimit : Nat;
    videoLimit : Nat;
  };

  type Design = {
    roomType : Text;
    style : Text;
    timestamp : Time.Time;
  };

  module Design {
    public func compareByTimestamp(d1 : Design, d2 : Design) : Order.Order {
      Int.compare(d1.timestamp, d2.timestamp);
    };
  };

  // STABLE STORAGE - persists across all upgrades and redeployments
  stable let userProfiles = Map.empty<Principal, UserProfile>();
  stable let userSubscriptions = Map.empty<Principal, SubscriptionPlan>();
  stable let userUsage = Map.empty<Principal, UsageData>();
  stable let designs = List.empty<Design>();
  // Retain for stable variable compatibility (was used by Stripe)
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;
  // Track claimed Razorpay payment IDs to prevent duplicate claims
  stable let claimedPayments = Map.empty<Text, Principal>();

  func getCurrentMonthYear() : Text {
    let now = Time.now();
    let seconds = now / 1_000_000_000;
    let days = seconds / 86400;
    let year = 1970 + (days / 365);
    let month = ((days % 365) / 30) + 1;
    year.toText() # "-" # (if (month < 10) { "0" } else { "" }) # Int.abs(month).toText();
  };

  // null plan = free tier: 1 photo, 0 videos
  func getPlanLimits(plan : ?SubscriptionPlan) : (Nat, Nat) {
    switch (plan) {
      case (null)      { (1, 0) };
      case (?#Starter) { (8, 1) };
      case (?#Basic)   { (20, 2) };
      case (?#Growth)  { (50, 5) };
      case (?#Pro)     { (120, 12) };
      case (?#Max)     { (9999, 9999) };
    };
  };

  func textToPlan(planId : Text) : ?SubscriptionPlan {
    switch (planId) {
      case ("starter") { ?#Starter };
      case ("basic")   { ?#Basic };
      case ("growth")  { ?#Growth };
      case ("pro")     { ?#Pro };
      case ("max")     { ?#Max };
      case (_)         { null };
    };
  };

  func getOrInitUsage(user : Principal) : UsageData {
    let currentMonth = getCurrentMonthYear();
    switch (userUsage.get(user)) {
      case (?usage) {
        if (usage.monthYear == currentMonth) { usage } else {
          let newUsage = { photosUsed = 0; videosUsed = 0; monthYear = currentMonth };
          userUsage.add(user, newUsage);
          newUsage;
        };
      };
      case null {
        let newUsage = { photosUsed = 0; videosUsed = 0; monthYear = currentMonth };
        userUsage.add(user, newUsage);
        newUsage;
      };
    };
  };

  // ── User Profile ─────────────────────────────────────────────
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  // ── Subscription ────────────────────────────────────────────
  public query ({ caller }) func getMySubscription() : async SubscriptionInfo {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let plan = userSubscriptions.get(caller);  // null = free tier
    let usage = getOrInitUsage(caller);
    let (photoLimit, videoLimit) = getPlanLimits(plan);
    { plan; photosUsed = usage.photosUsed; videosUsed = usage.videosUsed; photoLimit; videoLimit };
  };

  // ── Razorpay Payment Claim ───────────────────────────────────
  public shared ({ caller }) func claimRazorpayPayment(paymentId : Text, planId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: must be logged in");
    };
    switch (claimedPayments.get(paymentId)) {
      case (?existingUser) {
        if (existingUser != caller) {
          Runtime.trap("Payment already claimed by another user");
        };
        // Same user re-claiming is idempotent
      };
      case null {
        switch (textToPlan(planId)) {
          case (?plan) {
            claimedPayments.add(paymentId, caller);
            userSubscriptions.add(caller, plan);
            let currentMonth = getCurrentMonthYear();
            userUsage.add(caller, { photosUsed = 0; videosUsed = 0; monthYear = currentMonth });
          };
          case null {
            Runtime.trap("Invalid plan ID: " # planId);
          };
        };
      };
    };
  };

  // Admin: manually assign a plan
  public shared ({ caller }) func setUserPlan(user : Principal, plan : SubscriptionPlan) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admins only");
    };
    userSubscriptions.add(user, plan);
  };

  // ── Usage Tracking ─────────────────────────────────────────────
  public shared ({ caller }) func recordPhotoUsage() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let usage = getOrInitUsage(caller);
    let plan = userSubscriptions.get(caller);
    let (photoLimit, _) = getPlanLimits(plan);
    if (usage.photosUsed >= photoLimit) {
      Runtime.trap("Photo limit exceeded for current plan");
    };
    userUsage.add(caller, { photosUsed = usage.photosUsed + 1; videosUsed = usage.videosUsed; monthYear = usage.monthYear });
  };

  public shared ({ caller }) func recordVideoUsage() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let usage = getOrInitUsage(caller);
    let plan = userSubscriptions.get(caller);
    let (_, videoLimit) = getPlanLimits(plan);
    if (usage.videosUsed >= videoLimit) {
      Runtime.trap("Video limit exceeded for current plan");
    };
    userUsage.add(caller, { photosUsed = usage.photosUsed; videosUsed = usage.videosUsed + 1; monthYear = usage.monthYear });
  };

  // ── Stripe stubs (kept for stable variable compatibility) ─────────
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ── Design History ────────────────────────────────────────────
  public shared ({ caller }) func addDesign(roomType : Text, style : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    designs.add({ roomType; style; timestamp = Time.now() });
  };

  public query func getAllDesigns() : async [Design] {
    designs.toArray();
  };

  public query func getDesignHistorySorted() : async [Design] {
    designs.toArray().sort(Design.compareByTimestamp);
  };
};
