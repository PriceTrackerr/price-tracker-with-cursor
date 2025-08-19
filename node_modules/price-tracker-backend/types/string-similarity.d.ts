declare module 'string-similarity' {
  export interface Rating {
    target: string;
    rating: number;
  }
  export interface BestMatch {
    ratings: Rating[];
    bestMatch: Rating;
    bestMatchIndex: number;
  }
  export function compareTwoStrings(str1: string, str2: string): number;
  export function findBestMatch(mainString: string, targetStrings: string[]): BestMatch;
} 