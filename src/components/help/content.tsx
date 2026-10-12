type Help = { title: string; lead: string; points: React.ReactNode[]; tip?: React.ReactNode };

const K = ({ children }: { children: React.ReactNode }) => (
  <kbd className="figures rounded-[3px] border border-rule-strong bg-paper-3 px-1 text-[0.75rem]">{children}</kbd>
);

export const HELP = {
  week: {
    title: "Je week",
    lead: "Je hele week op één blad: wat er gepland staat en hoeveel tijd je er echt aan besteedde.",
    points: [
      "Elke rij is een dag. Klik op het getal van een dag om die dag rechts te openen.",
      <>
        Typ op de regel onder een dag om een taak toe te voegen. Snelschrift werkt: <K>#italian</K> <K>morgen</K> <K>vr</K>{" "}
        <K>14:00</K> <K>45m</K>.
      </>,
      "Het lijstje voor die regel haalt open to-do's uit je secties en plant ze op die dag.",
      "Sleep een taak naar een andere dag om ze te verplaatsen. Op de telefoon: houd een taak even vast en sleep.",
      "Op de telefoon voegt de ronde plusknop onderaan overal een activiteit toe. Tik op een taak voor Klaar, Verwijderen en alle details.",
      "Afvinken levert XP op; de balk bovenaan laat zien hoe ver je van het volgende level bent.",
      "In de marge zie je per dag: gelogde tijd, geplande tijd en een balkje dat vult.",
      "Het gele lint markeert vandaag.",
    ],
    tip: (
      <>
        Overal in de app opent <K>Ctrl</K> + <K>K</K> (of <K>⌘</K> + <K>K</K>) het zoekvenster, waar je ook taken kan toevoegen.
      </>
    ),
  },
  day: {
    title: "Je dag",
    lead: "Alles voor één dag, plus het logboek van je tijd.",
    points: [
      "Op tijd: taken met een begintijd. Wanneer het uitkomt: taken zonder uur.",
      "Vink een taak af met het vakje. Klik op de naam om sectie, dag, duur, notities en documenten aan te passen.",
      "De afspeelknop start een timer op die taak. Er loopt altijd maar één timer; je ziet hem links (of onderaan op je gsm).",
      "To-do toont open to-do's van al je secties. Sleep ze naar een dag of gebruik de kalenderknop.",
      "Logboek: vergeten te timen? Kies Tijd loggen en vul van en tot in.",
    ],
  },
  sections: {
    title: "Secties",
    lead: "Al je secties op een rij, met wat er in elke sectie leeft.",
    points: [
      "To-do: taken die nog niet op een dag staan.",
      "Docs: documenten en geüploade bestanden.",
      "Gepland: taken die vanaf vandaag op een dag staan.",
      "Week: tijd die je deze week in die sectie logde.",
      "Rechts staan je laatst bewerkte documenten en bestanden uit alle secties.",
    ],
    tip: "Secties maak je zoveel als je wil, ook binnen elkaar (subsecties via het tandwiel van een sectie).",
  },
  section: {
    title: "Een sectie",
    lead: "De werkplek voor één onderwerp: to-do's, documenten, bestanden en projecten.",
    points: [
      "To-do: alles wat je ooit moet doen. Met de kalenderknop plan je een to-do in op een dag.",
      "Ingepland: wat al op een dag staat.",
      "Documenten: + maakt een nieuw notitiedocument, de pijl uploadt bestanden van je computer. Je kan bestanden ook gewoon hierheen slepen.",
      "Projecten: een doel in eenheden, bv. 200 lessen Italiaans. Afgevinkte taken die meetellen, vullen de balk.",
      "Het tandwiel bovenaan: naam, kleur, onder welke sectie, archiveren of verwijderen.",
      "Rechts zie je hoeveel tijd je hier spendeerde.",
    ],
  },
  document: {
    title: "Documenten",
    lead: "Notities in markdown, automatisch bewaard terwijl je typt.",
    points: [
      <>
        Markdown: <K># Titel</K>, <K>- lijstje</K>, <K>**vet**</K>, <K>[ ] vakje</K>, tabellen met <K>|</K>.
      </>,
      "Schrijven en Lezen wissel je rechtsboven. Lezen toont het opgemaakt.",
      "Labels voeg je toe onder de titel. Met het mapje koppel je het document aan meer secties.",
      "De speld zet het document bovenaan in de lijst.",
      "Een document koppelen aan een taak doe je vanuit de taak (klik op de taak, Documenten).",
    ],
    tip: (
      <>
        <K>Ctrl</K> + <K>S</K> bewaart meteen; anders gebeurt het vanzelf na een halve seconde.
      </>
    ),
  },
  file: {
    title: "Bestanden",
    lead: "Geüploade bestanden, alleen zichtbaar voor jou.",
    points: [
      "PDF's, afbeeldingen, video, audio en tekst zie je hier meteen.",
      "Andere bestanden (Word, PowerPoint, Excel...) download je om te openen.",
      "Klik op de naam om hem te wijzigen.",
      "Maximaal 50 MB per bestand.",
    ],
  },
  dashboard: {
    title: "Dashboard",
    lead: "Waar je tijd naartoe ging en hoe je projecten vorderen.",
    points: [
      "Level en XP: elke afgevinkte taak is 10 XP, elk uur gelogde tijd ook 10 XP, en elke dag van je reeks geeft 5 XP extra (tot 30 dagen).",
      "Gelogd: totale tijd deze week, met het verschil tegenover vorige week.",
      "Reeks: hoeveel dagen op rij je tijd logde.",
      "Per dag: de volle balk is gelogd, het stippellijnkader is wat je plande. Ga erover voor details.",
      "Per sectie en per taak: waar de tijd heen ging.",
      "Projecten: voortgang, tempo per week en wanneer je klaar bent als je zo doorgaat.",
      "De kaart van zestien weken kleurt donkerder op dagen waarop je meer werkte.",
    ],
  },
  schedules: {
    title: "Vaste planning",
    lead: "Afspraken die elke week terugkomen, zoals lessen of trainingen.",
    points: [
      "Kies de dagen, het uur, de duur en een begin- en einddatum.",
      "De app zet ze automatisch acht weken vooruit in je week.",
      "Een keer aanpassen of verplaatsen in de week mag; dat ene moment blijft dan zoals je het zette.",
      "Pauzeren haalt de komende keren weg zonder de planning te verliezen.",
    ],
  },
  import: {
    title: "Schema importeren",
    lead: "Een trainingsschema of planning uit een CSV- of JSON-bestand in je week zetten.",
    points: [
      "Kolommen met een datum werken, of een weeknummer plus weekdag (ma, di, ...) vanaf een startdatum.",
      "De app raadt welke kolom wat is; pas het aan bij Kolommen.",
      "Bekijk het voorbeeld, en voeg dan alles in één keer toe.",
      "Rechts kan je een hele import ongedaan maken.",
    ],
    tip: "Twijfel je over het formaat? Download het voorbeeldbestand onderaan.",
  },
  settings: {
    title: "Instellingen",
    lead: "Je account, je tijd en je agenda.",
    points: [
      "Account: je naam, e-mailadres en wachtwoord. Een nieuw wachtwoord meldt je andere toestellen af.",
      "Agenda op je iPhone: kopieer de abonnementslink en open Instellingen, Agenda (op nieuwere iOS onder Apps), Accounts, Voeg account toe, Overige, Voeg agenda-abonnement toe. Plak daar de link. Of tik op dit toestel gewoon op Abonneren.",
      "Nieuwe link maakt de oude ongeldig, handig als je hem per ongeluk deelde.",
      "Mensen (alleen voor de eigenaar): nodig iemand uit met een eigen, privé planner.",
    ],
  },
} satisfies Record<string, Help>;

export type HelpTopic = keyof typeof HELP;
