export interface OutfitRuleStep {
  step: number;
  minTemp: number;
  maxTemp: number;
  tempRange: string;
  description: string;
  tagColor: string;
  defaults: {
    outer: string;
    top: string;
    bottom: string;
    items: string[];
  };
  options: {
    outer: string[];
    top: string[];
    bottom: string[];
    items: string[];
  };
}

export interface OutfitSelection {
  outer: string;
  top: string;
  bottom: string;
  items: string[];
}
