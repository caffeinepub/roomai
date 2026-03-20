import Time "mo:core/Time";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Array "mo:core/Array";
import List "mo:core/List";

actor {
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

  let designs = List.empty<Design>();

  public shared ({ caller }) func addDesign(roomType : Text, style : Text) : async () {
    let newDesign : Design = {
      roomType;
      style;
      timestamp = Time.now();
    };
    designs.add(newDesign);
  };

  public query ({ caller }) func getAllDesigns() : async [Design] {
    designs.toArray();
  };

  public query ({ caller }) func getDesignsByRoomType(roomType : Text) : async [Design] {
    designs.toArray().filter(
      func(d) {
        d.roomType == roomType;
      }
    );
  };

  public query ({ caller }) func getDesignHistorySorted() : async [Design] {
    designs.toArray().sort(Design.compareByTimestamp);
  };
};
