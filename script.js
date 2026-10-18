"use strict";

const weeklyWaterConsumption = [1, 1.5, 3.2, 3, 3.5, 0.5, 1];

function findMax(values) {
    let maximum = -Infinity;

    for (const value of values) {
        if (value > maximum) {
            maximum = value;
        }
    }

    return maximum;
}

function filterHighConsumption(values) {
    return values.filter(value => value > 3);
}

function calculateSum(values) {
    let sum = 0;

    for (const value of values) {
        sum += value;
    }

    return sum;
}

function analyzeWaterConsumption(values) {
    if (values.length === 0) {
        throw new RangeError("Массив потребления воды не должен быть пустым.");
    }

    let lowConsumptionDays = 0;

    for (const value of values) {
        if (value <= 1.5) {
            lowConsumptionDays += 1;
        }
    }

    const total = calculateSum(values);

    return {
        total,
        maximum: findMax(values),
        highConsumptionDays: filterHighConsumption(values),
        lowConsumptionDays,
        lowConsumptionPercent: lowConsumptionDays / values.length * 100,
        average: total / values.length
    };
}

function runWaterTracker() {
    const enteredName = prompt("Как вас зовут?");
    const name = enteredName === null ? "" : enteredName.trim();
    const greeting = name === "" ? "Здравствуйте!" : `Здравствуйте, ${name}!`;
    const statistics = analyzeWaterConsumption(weeklyWaterConsumption);
    const formatNumber = new Intl.NumberFormat("ru-RU", {
        maximumFractionDigits: 2
    });

    alert(
        `${greeting}\nЗа неделю вы выпили ${formatNumber.format(statistics.total)} литров воды, ` +
        `в ${statistics.highConsumptionDays.length} днях норма была превышена`
    );

    console.log("Потребление воды по дням, л:", weeklyWaterConsumption);
    console.log("Максимальное потребление за день, л:", statistics.maximum);
    console.log("Дни с потреблением больше 3 литров:", statistics.highConsumptionDays);
    console.log("Суммарное потребление за неделю, л:", formatNumber.format(statistics.total));
    console.log("Среднее потребление за день, л:", formatNumber.format(statistics.average));
    console.log("Количество дней с низким потреблением (≤ 1,5 л):", statistics.lowConsumptionDays);
    console.log("Процент дней с низким потреблением:", `${formatNumber.format(statistics.lowConsumptionPercent)}%`);

    if (statistics.average < 2) {
        console.log("Рекомендуется увеличить потребление воды до 2–2,5 литров в день");
    }
}

runWaterTracker();
