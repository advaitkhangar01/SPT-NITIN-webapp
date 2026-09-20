export interface ComponentPreset {
  name: string;
  component: string;
  specification: string;
  brandModel: string;
  quantity: string;
}

export const PREDEFINED_COMPONENTS: ComponentPreset[] = [
  {
    name: "Solar PV Modules",
    component: "Solar PV Modules",
    specification: "High-efficiency Mono PERC / Half-Cut Technology",
    brandModel: "VIKRAM / WAAREE",
    quantity: "3.0 kW Capacity",
  },
  {
    name: "Grid-Tied Solar Inverter",
    component: "Grid-Tied Solar Inverter",
    specification: "High-efficiency string inverter with built-in protections",
    brandModel: "Polycab",
    quantity: "1 Unit (3 kW)",
  },
  {
    name: "Module Mounting Structure (MMS)",
    component: "Module Mounting Structure (MMS)",
    specification: "High-grade Galvanized Iron (GI), wind resistant structure",
    brandModel: "Standard Industrial",
    quantity: "1 Complete Set",
  },
  {
    name: "BOS & Electrical Protection",
    component: "BOS & Electrical Protection",
    specification: "ACDB/DCDB boxes, DC/AC Copper & Aluminum Cables, Surge Protection",
    brandModel: "Polycab",
    quantity: "1 Complete Lot",
  },
  {
    name: "Earthing & Lightning Protection",
    component: "Earthing & Lightning Protection",
    specification: "Chemical Earthing Rods, Copper Bonded Strips, LA Rod",
    brandModel: "Heavy Duty Kit",
    quantity: "3 Pits + LA",
  },
  {
    name: "Turnkey Execution & Commissioning",
    component: "Turnkey Execution & Commissioning",
    specification: "Design, Installation, Testing, and Net-Metering assistance",
    brandModel: "—",
    quantity: "Included",
  },
  {
    name: "Custom Description",
    component: "Custom Equipment / Service",
    specification: "Standard industrial specification",
    brandModel: "Standard",
    quantity: "1 Lot",
  },
];

export const PROPOSED_SYSTEM_OPTIONS = [
  "On-Grid Rooftop Solar",
  "Off-Grid Solar",
  "Hybrid Solar",
  "Commercial Rooftop Solar",
  "Industrial Solar",
  "Custom",
];

export const CONNECTION_TYPE_OPTIONS = [
  "LT 1-Phase Grid Connected",
  "LT 3-Phase Grid Connected",
  "HT Grid Connected",
  "Off-Grid",
  "Hybrid",
  "Custom",
];

export const PAYMENT_STATUS_OPTIONS = [
  "UNPAID",
  "PARTIALLY PAID",
  "PAID",
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  "UPI",
  "Bank Transfer",
  "Cash",
  "Cheque",
  "Other",
] as const;
