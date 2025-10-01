import { MessageBus } from "@homebridge/dbus-native";

declare module "@homebridge/dbus-native" {
  export function sessionBus(): MessageBus;
}
