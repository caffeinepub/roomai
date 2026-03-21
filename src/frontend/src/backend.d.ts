import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Design {
    style: string;
    timestamp: Time;
    roomType: string;
}
export type Time = bigint;
export interface backendInterface {
    addDesign(roomType: string, style: string): Promise<void>;
    getAllDesigns(): Promise<Array<Design>>;
    getDesignHistorySorted(): Promise<Array<Design>>;
    getDesignsByRoomType(roomType: string): Promise<Array<Design>>;
    _initializeAccessControlWithSecret(secret: string): Promise<void>;
}
