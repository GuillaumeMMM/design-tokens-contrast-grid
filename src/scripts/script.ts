import html2canvas from "html2canvas";
import { generateTable } from "./generateTable";
import { Color } from "./types";
import parse from "color-parse";
import { isLocalStorageAvailable } from "./localsotrage";

const defaultColors = `--white: #ffffff;
--grey-1: #b1b1b3;
--grey-2: #4a4a4f;
--grey-3: #222222;`;

const defaultForm = {
  textSize: "normal" as "normal" | "large",
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
      const color: Color = {
        code: parse(code),
        initialVal: code,
        name,
      };

      return color;
    });

  return colors;
}

function getColorsFromJSONTokens(tokens: Object) {
  const values = {};

  function traverse(currentObj, currentName) {
    for (const [key, value] of Object.entries(currentObj)) {
      const newKey = currentName ? `${currentName}-${key}` : key;
      if (typeof value === "object" && value !== null) {
        traverse(value, newKey);
      } else {
        values[newKey] = value;
      }
    }
  }

  traverse(tokens, "");

  const validColors: Color[] = Object.entries(values)
    .filter(([key, val]) => typeof val === "string" && parse(val).space)
    .map(([key, val]) => ({
      code: parse(val as string),
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
          "conformity-cell-template"
        ) as HTMLTemplateElement
      )?.content;
      this.attachShadow({ mode: "open" }).appendChild(template.cloneNode(true));
    }
  }
);

const tokensInput = document.getElementById(
  "tokens"
) as HTMLTextAreaElement | null;
const contrastMethodSelect = document.getElementById(
  "contrast-validation"
) as HTMLSelectElement | null;
const textSizeSelect = document.getElementById(
  "text-size"
) as HTMLSelectElement | null;
const onlyOkCheckbox = document.getElementById(
  "only-ok"
) as HTMLInputElement | null;
const saveButton = document.getElementById(
  "save-button"
) as HTMLButtonElement | null;

if (
  !contrastMethodSelect ||
  !textSizeSelect ||
  !onlyOkCheckbox ||
  !tokensInput ||
  !saveButton
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
textSizeSelect.value = localStorageForm.textSize ?? defaultForm.textSize;
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

textSizeSelect.addEventListener("change", (e: Event) => {
  form.textSize = (e.target as HTMLSelectElement).value as "normal" | "large";
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
      (el as HTMLElement).style.display = "inline-block";
    });

    html2canvas(table).then((canvas) => {
      //  Hide additional informations
      Array.from(table.getElementsByClassName("show-on-export")).forEach(
        (el) => {
          (el as HTMLElement).style.display = "none";
        }
      );

      const link = document.createElement("a");
      link.download = `design-tokens-contrast-checker_${form.contrastMethod}_${
        form.textSize
      }_${new Date().getTime()}.jpeg`;
      link.href = canvas.toDataURL("image/jpeg", 1);
      link.click();
      link.parentElement?.removeChild(link);
    });
  }
});

function onFormSettingsChange() {
  saveFormToLocalStorage();
  generateTable(
    form.colors,
    form.colors,
    form.contrastMethod,
    form.textSize,
    form.onlyShowOK
  );
}

function saveFormToLocalStorage() {
  if (!isLocalStorageAvailable()) {
    return;
  }
  localStorage.setItem("form", JSON.stringify(form));
}
