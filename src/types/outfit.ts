export interface OutfitRuleStep {
  min_temp: number;
  max_temp: number;
  label: string;
  recommend: {
    outer: string;
    top: string[];
    bottom: string[];
    item: string[];
  };
  outer: string[];
  top: string[];
  bottom: string[];
  item: string[];
}

export interface OutfitSelection {
  outer: string[]; // 다중 선택 (레이어드 착용 지원)
  top: string[]; // 다중 선택 (레이어드 착용 지원)
  bottom: string[]; // 다중 선택
  items: string[]; // 다중 선택
}

export type OutfitCategory = 'outer' | 'top' | 'bottom' | 'items';
