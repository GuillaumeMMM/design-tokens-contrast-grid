export type Color = {
  name: string;
  colorHex: string;
  initialVal: string | number;
};

export type JSONDesignToken = {
  $value: unknown;
  $type?: string;
  $deprecated?: boolean | string;
  $description?: string;
  $extensions?: Object;
};

export type JSONDesignTokens =
  | JSONDesignToken
  | {
      [key: string]: JSONDesignToken | JSONDesignTokens;
    };

export type DesignToken = JSONDesignToken & {
  key: string;
};

export type TokenErrorType =
  | "MISSING_TYPE"
  | "EMPTY"
  | "INVALID_JSON"
  | "UNAUTHORIZED_KEY_STR"
  | "INEXISTANT_REF";

export type TokenError = {
  token?: DesignToken;
  type: TokenErrorType;
};
