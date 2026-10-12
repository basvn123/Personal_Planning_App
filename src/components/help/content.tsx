type Help = { title: string; lead: string; points: React.ReactNode[]; tip?: React.ReactNode };

const K = ({ children }: { children: React.ReactNode }) => (
  <kbd className="figures rounded-[3px] border border-rule-strong bg-paper-3 px-1 text-[0.75rem]">{children}</kbd>
);

export const HELP = {
  week: {
    title: "Je week",
    lead: "Je hele week op één blad: wat er gepland staat en hoeveel tijd je er echt aan besteedde.",
    points: [
      "Elke kaart is een dag. Tik op de datum om die dag te openen; op de telefoon opent de planner meteen op vandaag.",
      "Toevoegen: de plusknop (onderaan, links op de computer, of de toets N) of Toevoegen onder een dag. Je kiest meteen de dag, van hoe laat tot hoe laat (of alleen een duur) en de sectie.",
      "Meerdere dagen: kies bij Wanneer voor Meerdere dagen en tik de dagen aan in de kalender, of neem Werkdagen, Hele week of 7 dagen. Elke dag krijgt dezelfde taak.",
      "Verder vooruit of terug: tik op het kalendericoon naast de pijltjes, blader naar een maand en tik op een dag. In een andere week brengt Nu (Vandaag op de computer) je terug.",
      <>
        Snel typen kan ook: <K>#italian</K> <K>morgen</K> <K>vr</K> <K>14:00</K> <K>45m</K> in de naam vult de rest in.
      </>,
      "Sleep een taak naar een andere dag om ze te verplaatsen. Op de telefoon: houd een taak even vast en sleep.",
      "Tik op een taak om ze aan te passen: dezelfde keuzes als bij toevoegen, plus Klaar en Verwijderen bovenaan.",
      "Afvinken levert XP op; de balk bovenaan laat zien hoe ver je van het volgende level bent.",
      "Rechts op elke dag: gelogde tijd, geplande tijd en een balkje dat vult.",
      "De gele rand markeert vandaag. Vaste planning (lessen, trainingen) open je met de knop bovenaan.",
    ],
    tip: (
      <>
        Overal in de app opent <K>Ctrl</K> + <K>K</K> (of <K>⌘</K> + <K>K</K>) het zoekvenster, waar je ook taken kan toevoegen.
      </>
    ),
  },
  day: {
    title: "Je dag",
    lead: "Alles voor één dag als tijdlijn, plus het logboek van je tijd.",
    points: [
      "Op de telefoon staat de week bovenaan: elk bolletje is een taak, gevuld als ze klaar is. Tik op een dag om te wisselen, of op het kalendericoon voor een dag in een andere week of maand.",
      "Bovenaan: hoeveel tijd er gepland staat en van wanneer tot wanneer je dag loopt. Op tijd: een tijdlijn. Hoe langer een taak duurt, hoe langer haar balkje. Vrije tijd ertussen staat erbij, en de gele lijn is nu.",
      "Een rode begintijd betekent dat de taak overlapt met de vorige.",
      "Zonder tijd: taken zonder uur, met hun duur ervoor.",
      "Vink een taak af met het vakje. Tik op de naam om dag, begin- en eindtijd, duur, sectie, notities en documenten aan te passen.",
      "Vandaag staat Nu bezig bovenaan: in één tik een timer op wat je nu doet, ook als je langer bezig bent dan gepland.",
      "De afspeelknop start een timer op die taak. Er loopt altijd maar één timer; je ziet hem links, of op je telefoon als gele balk boven de knoppen.",
      "To-do toont open to-do's van al je secties (tik op het pijltje om ze te zien). Sleep ze naar een dag of gebruik de kalenderknop.",
      "Elke kaart heeft rechtsboven een plus om er meteen iets aan toe te voegen.",
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
    title: "Voortgang",
    lead: "Je level, waar je tijd naartoe ging en hoe je projecten vorderen.",
    points: [
      "Nu bezig, bovenaan: tik op een taak van vandaag om de timer te starten, of typ iets nieuws. Taken die nu gepland staan komen eerst.",
      "Loopt een taak langer dan gepland, dan telt de timer gewoon door en zie je hoeveel langer. Met Planning aanpassen schuift de planning mee.",
      "Iets anders schakelt over: de vorige timer stopt en de nieuwe start meteen. Er loopt altijd maar één timer, ook over meerdere toestellen.",
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
      "Op de telefoon vind je zoeken, vaste planning, importeren, licht of donker en afmelden ook onder Meer, rechtsonder.",
    ],
  },
} satisfies Record<string, Help>;

export type HelpTopic = keyof typeof HELP;
