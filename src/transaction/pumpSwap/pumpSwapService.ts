import { PumpAmmSdk, type Direction, type Pool } from "@pump-fun/pump-swap-sdk";
import { connection } from "../config";

// Initialize SDK
const pumpAmmSdk = new PumpAmmSdk(connection);
