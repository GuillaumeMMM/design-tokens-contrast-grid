import html2canvas from "html2canvas";
import { generateTable } from "./scripts/generateTable";
import { Color } from "./scripts/types";
import { isLocalStorageAvailable } from "./scripts/localsotrage";
import { colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";
import { getContrastLevel } from "./scripts/contrast";

extend([a11yPlugin]);

const defaultColors = `--white: #ffffff;
--grey-1: #b1b1b3;
--grey-2: #4a4a4f;
--grey-3: #222222;`;

const defaultForm = {
  contrastMethod: "wcag2.2AA",
  onlyShowOK: false,
  tokens: defaultColors,
  colors: getColorsFromTokens(defaultColors),
};

function getColorsFromTokens(tokens: string) {
  try {
    JSON.parse(tokens);
    return getColorsFromJSONTokens(JSON.parse(tokens));
  } catch {
    return getColorsFromCSSTokens(tokens);
  }
}

function getColorsFromCSSTokens(tokens: string) {
  const colors = tokens
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("--"))
    .map((line) => {
      const [name, code] = line
        .split(":")
        .map((el) => el.trim().replaceAll(";", ""));

      const colordVal = colord(code);
      const color: Color = {
        colorHex: colordVal.isValid() ? colordVal.toHex() : "",
        initialVal: code,
        name,
      };

      return color;
    })
    .filter((c) => Boolean(c.colorHex));

  return colors;
}

function getColorsFromJSONTokens(tokens: Object) {
  const values = {};

  function traverse(currentObj: any, currentName: any) {
    for (const [key, value] of Object.entries(currentObj)) {
      const newKey = currentName ? `${currentName}-${key}` : key;
      if (typeof value === "object" && value !== null) {
        traverse(value, newKey);
      } else {
        //  @ts-expect-error
        values[newKey] = value;
      }
    }
  }

  traverse(tokens, "");

  const validColors: Color[] = Object.entries(values)
    .filter(([key, val]) => typeof val === "string" && colord(val).isValid())
    .map(([key, val]) => ({
      colorHex: colord(val as string).toHex(),
      initialVal: val as string,
      name: key,
    }));

  return validColors;
}

customElements.define(
  "conformity-cell",
  class ConformityCell extends HTMLElement {
    constructor() {
      super();

      const template = (
        document?.getElementById(
          "conformity-cell-template",
        ) as HTMLTemplateElement
      )?.content;
      this.attachShadow({ mode: "open" }).appendChild(template.cloneNode(true));
    }
  },
);

const tokensInput = document.getElementById(
  "tokens",
) as HTMLTextAreaElement | null;
const contrastMethodSelect = document.getElementById(
  "contrast-validation",
) as HTMLSelectElement | null;
const onlyOkCheckbox = document.getElementById(
  "contrast-checkbox",
) as HTMLInputElement | null;
const saveButton = document.getElementById(
  "save-button",
) as HTMLButtonElement | null;
const saveButtonJSON = document.getElementById(
  "save-button-json",
) as HTMLButtonElement | null;

if (
  !contrastMethodSelect ||
  !onlyOkCheckbox ||
  !tokensInput ||
  !saveButton ||
  !saveButtonJSON
) {
  throw new Error("Element not found");
}

const formFromLocalStorageRaw = isLocalStorageAvailable()
  ? localStorage.getItem("form")
  : null;

const form = formFromLocalStorageRaw
  ? {
      ...defaultForm,
      ...JSON.parse(formFromLocalStorageRaw),
    }
  : defaultForm;

const localStorageForm = JSON.parse(formFromLocalStorageRaw ?? "{}");
tokensInput.value = localStorageForm.tokens ?? defaultForm.tokens;
contrastMethodSelect.value =
  localStorageForm.contrastMethod ?? defaultForm.contrastMethod;
onlyOkCheckbox.checked = localStorageForm.onlyShowOK ?? defaultForm.onlyShowOK;

onFormSettingsChange();

tokensInput.addEventListener("input", (e: Event) => {
  form.tokens = (e.target as HTMLTextAreaElement).value;
  form.colors = getColorsFromTokens((e.target as HTMLTextAreaElement).value);
  onFormSettingsChange();
});

contrastMethodSelect.addEventListener("change", (e: Event) => {
  form.contrastMethod = (e.target as HTMLSelectElement).value;
  onFormSettingsChange();
});

onlyOkCheckbox.addEventListener("change", (e: Event) => {
  form.onlyShowOK = (e.target as HTMLInputElement).checked;
  onFormSettingsChange();
});

saveButton.addEventListener("click", () => {
  const table = document.getElementById("contrast-table");

  if (table) {
    //  Show additional informations
    Array.from(table.getElementsByClassName("show-on-export")).forEach((el) => {
      (el as HTMLElement).classList.remove("visually-hidden");
    });

    html2canvas(table).then((canvas) => {
      //  Hide additional informations
      Array.from(table.getElementsByClassName("show-on-export")).forEach(
        (el) => {
          (el as HTMLElement).classList.add("visually-hidden");
        },
      );

      const link = document.createElement("a");
      link.download = `design-tokens-contrast-checker_${form.contrastMethod}_${new Date().getTime()}.jpeg`;
      link.href = canvas.toDataURL("image/jpeg", 1);
      link.click();
      link.parentElement?.removeChild(link);
    });
  }
});

saveButtonJSON.addEventListener("click", () => {
  const res: unknown[] = [];
  form.colors.forEach((color1: Color) => {
    form.colors.forEach((color2: Color) => {
      const level = colord(color1.colorHex).contrast(color2.colorHex);
      const method = form.contrastMethod;
      const isLarge = Boolean(method.split(".large")[1]);
      const isValidContrast =
        level >
        getContrastLevel({
          level: method,
          size: isLarge ? "large" : "normal",
        });
      res.push({
        color1,
        color2,
        contrast: colord(color1.colorHex).contrast(color2.colorHex),
        method: form.contrastMethod,
        isValid: isValidContrast,
      });
    });
  });

  const jsonString = JSON.stringify(res, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `design-tokens-contrast-checker_${form.contrastMethod}_${new Date().getTime()}.json`;

  document.body.appendChild(link);
  link.click();

  URL.revokeObjectURL(url);
  link.remove();
});

function onFormSettingsChange() {
  saveFormToLocalStorage();
  generateTable(form.colors, form.colors, form.contrastMethod, form.onlyShowOK);
}

function saveFormToLocalStorage() {
  if (!isLocalStorageAvailable()) {
    return;
  }
  localStorage.setItem("form", JSON.stringify(form));
}
