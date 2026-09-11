import { Color } from "./types";
import { getContrast, getContrastLevel } from "./contrast";
import adjectivesRaw from "../assets/text/adjectives.txt?raw";
import anomalsRaw from "../assets/text/animals.txt?raw";

const adjectives = adjectivesRaw.split("\n");
const animals = anomalsRaw.split("\n");

export function getWord() {
  const rand1 = Math.trunc(Math.random() * adjectives.length);
  const rand2 = Math.trunc(Math.random() * animals.length);
  return `${adjectives[rand1]} ${animals[rand2]}`;
}

export function generateTable(
  textColors: Color[],
  backgroundColors: Color[],
  contrastMethod: string,
  onlyShowOK: boolean,
) {
  const table = document.getElementById("contrast-table");
  const tableHeadRow = table?.querySelector("thead > tr");
  const tableBody = table?.querySelector("tbody");

  if (!table || !tableHeadRow || !tableBody) {
    throw new Error("No table found");
  }

  while (tableHeadRow.firstChild) {
    tableHeadRow.removeChild(tableHeadRow.firstChild);
  }

  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }

  if (textColors.length === 0) {
    const noDataTr = document.createElement("tr");
    const noDataTd = document.createElement("td");
    noDataTd.textContent = "No colors were found in the input.";
    noDataTr.appendChild(noDataTd);
    tableBody.appendChild(noDataTr);

    return;
  }

  const th = document.createElement("th");
  tableHeadRow.appendChild(th);

  backgroundColors.forEach((bgColor, bgColorIndex) => {
    const th = document.createElement("th");
    th.setAttribute("scope", "col");

    const colColorContent = document.createElement("div");
    colColorContent.classList.add("th-content");
    colColorContent.textContent = bgColor.name;

    const colColorSpan = document.createElement("span");
    colColorSpan.classList.add("color-chip");
    colColorSpan.style.backgroundColor = `${bgColor.initialVal}`;

    colColorContent.appendChild(colColorSpan);
    th.appendChild(colColorContent);

    tableHeadRow.appendChild(th);

    textColors.forEach((txtColor, txtColorIndex) => {
      if (bgColorIndex === 0) {
        const tr = document.createElement("tr");
        const thRow = document.createElement("th");
        thRow.setAttribute("scope", "row");

        const rowColorContent = document.createElement("div");
        rowColorContent.classList.add("th-content");
        rowColorContent.textContent = txtColor.name;

        const rowColorSpan = document.createElement("span");
        rowColorSpan.classList.add("color-chip");
        rowColorSpan.style.backgroundColor = `${txtColor.initialVal}`;

        rowColorContent.appendChild(rowColorSpan);
        thRow.appendChild(rowColorContent);

        tr.appendChild(thRow);
        tableBody.appendChild(tr);
      }
      const row = tableBody.querySelector(
        `tr:nth-of-type(${txtColorIndex + 1})`,
      );
      const contrastLevel = getContrast(txtColor.code, bgColor.code);
      const isLarge = Boolean(contrastMethod.split(".large")[1]);
      const isValidContrast =
        contrastLevel >
        getContrastLevel({
          level: contrastMethod,
          size: isLarge ? "large" : "normal",
        });

      if (!onlyShowOK || isValidContrast) {
        const cell = document.createElement("conformity-cell");

        cell.style.setProperty("--color", `${txtColor.initialVal}`);
        cell.style.setProperty("--bg", `${bgColor.initialVal}`);

        const contrastLevelSpan = document.createElement("span");
        contrastLevelSpan.setAttribute("slot", "contrast-level");
        contrastLevelSpan.innerHTML = `<span class="visually-hidden">"${
          isValidContrast ? "valid" : "invalid"
        } contrast level for ${txtColor.initialVal} text and ${
          bgColor.initialVal
        } background"</span><span aria-hidden="true">${
          isValidContrast ? "✅" : "❌"
        }</span> ${contrastLevel.toFixed(1)}:1`;

        const exampleTextSpan = document.createElement("span");
        exampleTextSpan.setAttribute("slot", "lorem-ipsum");
        exampleTextSpan.textContent = getWord();

        cell.appendChild(exampleTextSpan);
        cell.appendChild(contrastLevelSpan);

        row?.appendChild(cell);
      } else {
        const emptyCell = document.createElement("td");
        row?.appendChild(emptyCell);
      }
    });
  });
}
