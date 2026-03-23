import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Stripe "stripe/stripe";
import Time "mo:core/Time";

module {
  type UserProfile = {
    name : Text;
  };

  type SubscriptionPlan = {
    #Starter;
    #Basic;
    #Growth;
    #Pro;
    #Max;
  };

  type UsageData = {
    photosUsed : Nat;
    videosUsed : Nat;
    monthYear : Text;
  };

  type SubscriptionInfo = {
    plan : ?SubscriptionPlan;
    photosUsed : Nat;
    videosUsed : Nat;
    photoLimit : Nat;
    videoLimit : Nat;
  };

  type CustomTheme = {
    id : Text;
    name : Text;
    prompt : Text;
    createdAt : Time.Time;
  };

  type PayResponse = {
    success : Text;
    razorpayOrderId : Text;
  };

  type StripePaymentRequest = {
    #initialize : { sessionId : Text };
    #status : { paymentId : Text };
  };

  type StripeStatus = {
    #processing : Text;
    #failed : Text;
    #completed : Text;
  };

  type Design = {
    roomType : Text;
    style : Text;
    timestamp : Time.Time;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    userSubscriptions : Map.Map<Principal, SubscriptionPlan>;
    userUsage : Map.Map<Principal, UsageData>;
    designs : List.List<Design>;
    stripeConfiguration : ?Stripe.StripeConfiguration;
    claimedPayments : Map.Map<Text, Principal>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    userSubscriptions : Map.Map<Principal, SubscriptionPlan>;
    userUsage : Map.Map<Principal, UsageData>;
    designs : List.List<Design>;
    stripeConfiguration : ?Stripe.StripeConfiguration;
    claimedPayments : Map.Map<Text, Principal>;
    userCustomThemes : Map.Map<Principal, [CustomTheme]>;
    puterToken : ?Text;
  };

  public func run(old : OldActor) : NewActor {
    { old with
      userCustomThemes = Map.empty<Principal, [CustomTheme]>();
      puterToken = null;
    };
  };
};
