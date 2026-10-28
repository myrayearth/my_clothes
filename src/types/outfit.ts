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
  outer: string; // 단일 선택 ('없음' 포함)
  top: string[]; // 다중 선택 (레이어드 착용 지원)
  bottom: string[]; // 다중 선택
  items: string[]; // 다중 선택
}

export type OutfitCategory = 'outer' | 'top' | 'bottom' | 'items';
