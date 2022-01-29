export const TURNS = 6;
export const BASE = 16;
export const WORD_LENGTH = 4;
export const DAY_LENGTH = 24 * 60 * 60 * 1_000;
export const ZEROTH_BYTLE = new Date("2022-01-24T00:00:00.000Z");
export const WIN_MESSAGES = ["Genius", "Magnificent", "Impressive", "Splendid", "Great", "Phew"];

export var main;
export var board;
export var input;
export var entry;
export var shareButton;
export var toast;

export var currentRow = 0;
export var targetNumber = 0;
export var previousEntries = [];
export var previousStates = [];
export var correctKeys = [];
export var almostKeys = [];
export var triedKeys = [];
export var finishedGame = false;

function setCellContents(cell, contents) {
    cell.innerHTML = "";

    if (contents != "") {
        var span = document.createElement("span");

        span.textContent = contents;

        cell.append(span);
    }
}

function setCellState(cell, state) {
    cell.setAttribute("hexle-state", state);
}

function getDigitRange(value) {
    var digitValues = value.split("").map((digit) => parseInt(digit, BASE)).sort((a, b) => a - b);

    return digitValues[WORD_LENGTH - 1] - digitValues[0];
}

function getHint(number = targetNumber) {
    var digitValues = number.toString(BASE).padStart(WORD_LENGTH, "0");

    return getDigitRange(digitValues);
}

function generateBoard() {
    for (var i = 0; i < TURNS; i++) {
        var row = document.createElement("hexle-row");

        for (var j = 0; j < WORD_LENGTH; j++) {
            var cell = document.createElement("hexle-cell");

            row.append(cell);
        }

        board.append(row);
    }
}

function generateInput() {
    [["0", "1", "2", "3"], ["4", "5", "6", "7"], ["8", "9", "A", "B"], ["C", "D", "E", "F"]].forEach(function(keyRow) {
        var row = document.createElement("hexle-row");

        keyRow.forEach(function(keyValue) {
            var key = document.createElement("button");

            key.setAttribute("hexle-key", keyValue.toLowerCase());

            key.textContent = keyValue;

            key.addEventListener("click", function() {
                if (entry.value.length >= WORD_LENGTH) {
                    return;
                }

                entry.value = entry.value + keyValue;

                updateEntry();
            });

            row.append(key);
        });

        input.append(row);
    });
}

export function getHexleNumber() {
    return Math.floor((new Date().getTime() - ZEROTH_BYTLE.getTime()) / DAY_LENGTH);
}

export function generateTargetNumber() {
    targetNumber = ((getHexleNumber() * 69420) + 80085) % (BASE ** WORD_LENGTH);
}

export function showToast(message) {
    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(function() {
        toast.classList.remove("show");
    }, 3_000);
}

export function setRowValue(value, row = currentRow) {
    document.querySelectorAll("hexle-board hexle-row")[row].querySelectorAll("hexle-cell").forEach(function(cell, i) {
        setCellContents(cell, value[i]);
    });
}

export function setRowStates(states, row = currentRow, animate = true) {
    document.querySelectorAll("hexle-board hexle-row")[row].querySelectorAll("hexle-cell").forEach(function(cell, i) {
        setTimeout(function() {
            setCellState(cell, states[i]);
        }, animate ? i * 200 : 0);
    });
}

export function setKeyState(key, state) {
    document.querySelector(`hexle-input button[hexle-key="${key.toLowerCase()}"]`).setAttribute("hexle-state", state);
}

export function setInputStates() {
    triedKeys.forEach(function(key) {
        setKeyState(key, "notQuite");
    });

    almostKeys.forEach(function(key) {
        setKeyState(key, "almost");
    });

    correctKeys.forEach(function(key) {
        setKeyState(key, "correct");
    });
}

export function setStreak(won = false) {
    var hasStreak = localStorage.getItem("hexle_lastHexle") != null;
    var lastHexle = Number(localStorage.getItem("hexle_lastHexle"));

    if (won && (!hasStreak || lastHexle >= getHexleNumber() - 1)) {
        localStorage.setItem("hexle_lastWin", new Date().getTime());
        localStorage.setItem("hexle_lastHexle", getHexleNumber());
        localStorage.setItem("hexle_winStreak", Number(localStorage.getItem("hexle_winStreak") || 0) + 1);

        return Number(localStorage.getItem("hexle_winStreak"));
    }

    localStorage.removeItem("hexle_lastWin");
    localStorage.removeItem("hexle_lastHexle");
    localStorage.setItem("hexle_winStreak", won ? 1 : 0);

    return Number(localStorage.getItem("hexle_winStreak"));
}

export function checkCurrentRow(animate = true) {
    var lastEntry = previousEntries[previousEntries.length - 1].toUpperCase();
    var targetEntry = targetNumber.toString(BASE).padStart(WORD_LENGTH, "0").toUpperCase().split("");
    var states = new Array(WORD_LENGTH).fill("notQuite");

    var pool = {};

    triedKeys.push(...lastEntry);

    targetEntry.forEach(function(digit) {
        pool[digit] = (pool[digit] || 0) + 1;
    });

    targetEntry.forEach(function(digit, i) {
        if (lastEntry[i] == digit) {
            states[i] = "correct";
            pool[digit] = (pool[digit] || 0) - 1;

            correctKeys.push(lastEntry[i]);

            return;
        }
    });

    targetEntry.forEach(function(digit, i) {
        if (states[i] == "correct") {
            return;
        }

        if ((pool[lastEntry[i]] || 0) > 0) {
            states[i] = "almost";
            pool[lastEntry[i]] = (pool[lastEntry[i]] || 0) - 1;

            almostKeys.push(lastEntry[i]);

            return;
        }

        states[i] = "notQuite";
    });

    previousStates = states;

    setRowStates(states, currentRow, animate);
    setInputStates();
}

export function checkEntryHint(value = entry.value) {
    return getDigitRange(value) == getHint();
}

export function acceptEntry(value = entry.value, save = true, animate = true) {
    if (finishedGame) {
        return;
    }

    main.setAttribute("hexle-state", "playing");

    if (!checkEntryHint(value)) {
        showToast("Doesn't satisfy hint");

        return;
    }

    setRowValue(value);

    previousEntries.push(value);

    if (save) {
        localStorage.setItem("hexle_number", getHexleNumber());
        localStorage.setItem("hexle_currentGame", JSON.stringify(previousEntries));
    }

    setRowStates(new Array(WORD_LENGTH).fill("notYet"), currentRow, false);

    checkCurrentRow(animate);

    entry.value = "";
    currentRow++;

    var won = true;

    previousStates.forEach(function(state) {
        if (state != "correct") {
            won = false;
        }
    });

    if (won) {
        finishedGame = true;

        var streak = localStorage.getItem("hexle_winStreak") || 1;

        if (save) {
            streak = setStreak(true);

            showToast(WIN_MESSAGES[currentRow - 1]);
        }

        document.querySelector("#result h2").textContent = "You got it!";
        document.querySelector("#result #comment").textContent = `You found today's Hexle in ${currentRow.toString(BASE).toUpperCase()} tries. Don't forget to come back tomorrow for another game!`;
        document.querySelector("#result #streak").textContent = streak == 1 ? "1 day" : `${streak} days`;

        main.setAttribute("hexle-state", "finished won");
    } else if (currentRow >= TURNS) {
        finishedGame = true;

        if (save) {
            setStreak(false);
        }

        document.querySelector("#result h2").textContent = "Not today!";
        document.querySelector("#result p").textContent = `You have run out of tries! Today's Hexle answer is ${targetNumber.toString(BASE).padStart(WORD_LENGTH, "0").toUpperCase()}. Come back tomorrow for another game!`;

        main.setAttribute("hexle-state", "finished lost");
    }
}

export function updateEntry() {
    if (finishedGame) {
        return;
    }

    setRowValue(entry.value.padEnd(WORD_LENGTH, " ").split(""), currentRow);
    setRowStates(new Array(WORD_LENGTH).fill("input"), currentRow, false);
}

export function copyGameToClipboard() {
    var contents = `jamesl.me/hexle ${getHexleNumber().toString(BASE).padStart(WORD_LENGTH, "0").toUpperCase()} ${currentRow.toString(BASE).toUpperCase()}/6\n\n`;

    for (var i = 0; i < currentRow; i++) {
        var cells = document.querySelectorAll("hexle-row")[i].querySelectorAll("hexle-cell");

        cells.forEach(function(cell) {
            switch (cell.getAttribute("hexle-state")) {
                case "correct":
                    contents += "🟩";
                    break;

                case "almost":
                    contents += "🟨";
                    break;

                default:
                    contents += "⬜";
                    break;
            }
        });

        if (i != currentRow - 1) {
            contents += "\n";
        }
    }

    navigator.clipboard.writeText(contents);

    shareButton.textContent = "Copied to clipboard!";

    setTimeout(function() {
        shareButton.textContent = "Share";
    }, 2_000);
}

function adjustCells() {
    var firstCell = document.querySelector("hexle-cell");
    var width = firstCell.clientWidth;

    document.querySelectorAll("hexle-cell").forEach(function(cell) {
        cell.style.height = `${width}px`;
        cell.style.fontSize = `${width * 0.6}px`;
    });
}

window.addEventListener("load", function() {
    main = document.querySelector("main");
    board = document.querySelector("hexle-board");
    input = document.querySelector("hexle-input");
    entry = document.querySelector("#entry");
    shareButton = document.querySelector("#shareButton");
    toast = document.querySelector("#toast");

    document.querySelector("#hexleNumber").textContent = "#" + getHexleNumber().toString(BASE).padStart(WORD_LENGTH, "0").toUpperCase();

    generateTargetNumber();
    generateBoard();
    generateInput();
    adjustCells();

    document.querySelector("#hint").textContent = `Hint: highest digit minus lowest digit = ${getHint().toString(BASE).toUpperCase()}`;

    if (Number(localStorage.getItem("hexle_number")) != getHexleNumber()) {
        localStorage.removeItem("hexle_currentGame");
    }

    if (localStorage.getItem("hexle_currentGame") != null) {
        try {
            var entries = JSON.parse(localStorage.getItem("hexle_currentGame"));

            entries.forEach((entry) => acceptEntry(entry, false, false));
        } catch (e) {}
    }

    document.body.addEventListener("keydown", function(event) {
        if (finishedGame) {
            return;
        }

        if (["Tab", "ArrowLeft", "ArrowRight"].includes(event.key) || event.ctrlKey || event.shiftKey) {
            return;
        }

        entry.selectionStart = entry.value.length;
        entry.selectionEnd = entry.value.length;

        entry.focus();

        if (event.key == "Backspace") {
            return;
        }

        if (event.key == "Enter") {
            if (entry.value == "") {
                return;
            }

            acceptEntry();

            return;
        }

        if (entry.value.length >= WORD_LENGTH) {
            event.preventDefault();

            return;
        }

        if (Number.isNaN(parseInt(event.key, 16))) {
            event.preventDefault();
        }
    });

    document.body.addEventListener("keyup", function() {
        updateEntry();
    });

    entry.addEventListener("blur", function() {
        if (entry.value != "") {
            acceptEntry();
        }
    });

    shareButton.addEventListener("click", function() {
        copyGameToClipboard();
    });

    document.querySelector("#inputDelete").addEventListener("click", function() {
        entry.value = entry.value.substring(0, entry.value.length - 1);

        updateEntry();
    });

    document.querySelector("#inputEnter").addEventListener("click", function() {
        acceptEntry();
    });
});

window.addEventListener("resize", function() {
    adjustCells();
});