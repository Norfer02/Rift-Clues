export type Locale = "en" | "fr";

export type TranslationValues = Record<string, string | number>;

export type TranslationMessage = {
  key: string;
  values?: TranslationValues;
};
