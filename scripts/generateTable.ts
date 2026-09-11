import { Color } from "./types";
import { getContrastLevel } from "./contrast";
import adjectivesRaw from "../assets/text/adjectives.txt?raw";
import anomalsRaw from "../assets/text/animals.txt?raw";
import { colord } from "colord";

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
    colColorContent.textContent = formatHeadName(bgColor.name);

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
        rowColorContent.textContent = formatHeadName(txtColor.name);

        const rowColorSpan = document.createElement("span");
        rowColorSpan.classList.add("color-chip");
        rowColorSpan.style.backgroundColor = `${txtColor.initialVal}`;

        thRow.appendChild(rowColorContent);
        rowColorContent.appendChild(rowColorSpan);

        tr.appendChild(thRow);
        tableBody.appendChild(tr);
      }
      const row = tableBody.querySelector(
        `tr:nth-of-type(${txtColorIndex + 1})`,
      );
      const contrastLevel = colord(txtColor.colorHex).contrast(
        bgColor.colorHex,
      );

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
          isValidContrast ? "✅" : "❌\uFE0F"
        }</span> ${contrastLevel.toFixed(1)}:1`;

        const exampleTextSpan = document.createElement("span");
        exampleTextSpan.setAttribute("slot", "lorem-ipsum");
        exampleTextSpan.textContent = getWord();

        const linkSlotSpan = document.createElement("span");
        linkSlotSpan.setAttribute("slot", "contrast-link");
        linkSlotSpan.innerHTML = `<a class="contrast-link" aria-label="Open contrast explorer for combination" href="https://a11ycontrast.eu/${txtColor.colorHex}/${bgColor.colorHex}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-label="New tab"><path fill="currentColor" d="M26,28H6a2.0027,2.0027,0,0,1-2-2V6A2.0027,2.0027,0,0,1,6,4H16V6H6V26H26V16h2V26A2.0027,2.0027,0,0,1,26,28Z"/><polygon fill="currentColor" points="20 2 20 4 26.586 4 18 12.586 19.414 14 28 5.414 28 12 30 12 30 2 20 2"/></svg></a>`;

        cell.appendChild(exampleTextSpan);
        cell.appendChild(contrastLevelSpan);
        cell.appendChild(linkSlotSpan);

        row?.appendChild(cell);
      } else {
        const emptyCell = document.createElement("td");
        row?.appendChild(emptyCell);
      }
    });
  });
}

function formatHeadName(name: string) {
  if (name.startsWith("--")) {
    return name.slice(2);
  }
  return name;
}
