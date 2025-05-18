const fs = require('fs'); // Vstaveny modul Node.js pre pracu so suborovym systemom
const path = require('path'); // Vstaveny modul Node.js pre pracu s cestami k suborom

/**
 * Nacita transakcie zo suboru.
 * Subor by mal obsahovat JavaScript pole objektov.
 * @param {string} filePath Cesta k suboru s transakciami.
 * @returns {Array<Object>|null} Pole transakcii alebo null v pripade chyby.
 */
function nacitajTransakcieZoSuboru(filePath) {
  try {
    const obsahSuboru = fs.readFileSync(filePath, 'utf-8');

    // Kedze obsah suboru je JavaScript pole (nie striktny JSON),
    // pouzijeme new Function() na jeho bezpecne vyhodnotenie.
    // 'return ' pred obsahom zabezpeci, ze vyraz bude vrateny.
    const transakcie = new Function(`return ${obsahSuboru}`)();

    if (!Array.isArray(transakcie)) {
      console.error(`Chyba: Obsah suboru "${filePath}" nebol vyhodnoteny ako pole.`);
      return null;
    }
    return transakcie;
  } catch (error) {
    console.error(`Nastala chyba pri nacitani alebo spracovani suboru "${filePath}":`, error);
    return null;
  }
}

/**
 * Transformuje pole transakcii na POLE OBJEKTOV zoskupenych podla rokov.
 * Kazdy objekt v poli reprezentuje jeden rok a obsahuje jeho zrusene transakcie.
 * Roky (objekty v poli) a transakcie vramci rokov su zoradene od najnovsieho po najstarsi.
 * @param {Array<Object>} transactions Pole objektov transakcii.
 * @returns {Array<Object>|null} Pole objektov {year, transactions} alebo null, ak vstup nie je platny.
 */
function transformujZruseneTransakciePodlaRoka(transactions) {
  if (!transactions || !Array.isArray(transactions)) {
    console.error("Chyba: Vstup pre transformaciu nie je platne pole transakcii.");
    return null;
  }

  // 1. Vyfiltrujeme len zrusene transakcie (state: "canceled")
  //    a zaroven zabezpecime, ze kazda transakcia ma potrebne vlastnosti.
  const zruseneTransakcie = transactions.filter(
    (t) => t && t.state === "canceled" && typeof t.year !== 'undefined' && typeof t.createdAt !== 'undefined'
  );

  // 2. Zoskupime transakcie podla roka pomocou `reduce` do pomocneho objektu
  const zoskupenePodlaRoka = zruseneTransakcie.reduce((acc, transakcia) => {
    const rok = transakcia.year;

    // Ak pre dany rok este neexistuje pole v akumulatore, vytvorime ho
    if (!acc[rok]) {
      acc[rok] = [];
    }

    // Pridame transakciu do pola pre dany rok
    acc[rok].push(transakcia);
    return acc; // Vratime akumulator pre dalsiu iteraciu
  }, {}); // Pociatocna hodnota akumulatora je prazdny objekt

  // 3. Ziskame kluce (roky) z pomocneho objektu a zoradime ich zostupne (od najnovsieho)
  const zoradeneRokyKluce = Object.keys(zoskupenePodlaRoka).sort((a, b) => parseInt(b) - parseInt(a)); // Explicitne ako cisla pre spravne triedenie

  // 4. Vytvorime vysledne pole objektov, iterujeme cez zoradene roky
  const finalnyZoradenyVystup = zoradeneRokyKluce.map(rokKluc => {
    // Ziskame transakcie pre aktualny rok z pomocneho objektu
    const transakcieRoka = zoskupenePodlaRoka[rokKluc];

    // Zoradime transakcie pre tento rok od najnovsej po najstarsiu
    const zoradeneTransakcieRoka = [...transakcieRoka].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    // Vratime objekt pre aktualny rok s jeho zoradenymi transakciami
    return {
      year: parseInt(rokKluc), // Rok ako cislo
      transactions: zoradeneTransakcieRoka
    };
  });

  return finalnyZoradenyVystup;
}

// Hlavna cast skriptu (main script execution)
function main() {
  // Vytvorime cestu k suboru 'transactions.txt' v rovnakom adresari ako tento skript
  const cestaKSuboru = path.join(__dirname, 'transactions.txt');
  const dataTransakcii = nacitajTransakcieZoSuboru(cestaKSuboru);

  if (dataTransakcii) {
    const transformovaneTransakcie = transformujZruseneTransakciePodlaRoka(dataTransakcii);
    if (transformovaneTransakcie) {
      console.log(JSON.stringify(transformovaneTransakcie, null, 2));
    } else {
      console.log("Transformacia dat zlyhala.");
    }
  } else {
    console.log("Nepodarilo sa nacitat data transakcii zo suboru.");
  }
}

// Spustime hlavnu funkciu
main();