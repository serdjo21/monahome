/**
 * Tekstualne stranice sajta. Spisak je fiksan (adrese ne smeju da se sudaraju sa sobama);
 * tekst se uređuje u adminu (Tekstovi i stranice). Dok stranica nije izmenjena, prikazuje se nacrt ispod.
 *
 * Pravne stranice su nacrt po opštim pravilima za online prodaju u Srbiji (Zakon o zaštiti potrošača,
 * Zakon o zaštiti podataka o ličnosti). Pre lansiranja ih mora pregledati stručno lice, uz podatke firme
 * na mestima označenim uglastim zagradama.
 */
export const PAGE_SLUGS = [
  "o-nama",
  "kontakt",
  "dostava",
  "reklamacije-i-povracaj",
  "uslovi-koriscenja",
  "privatnost",
  "kolacici",
  "saradnja",
] as const;

export type PageSlug = (typeof PAGE_SLUGS)[number];

export type PageContent = {
  slug: PageSlug;
  title: string;
  intro: string | null;
  body: string;
  seoDescription: string | null;
  updatedAt: Date | null;
};

export function isPageSlug(value: string): value is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(value);
}

/** Grupa u adminu i oznaka da je stranica pravna (podseća na proveru pre lansiranja). */
export const PAGE_GROUP: Record<PageSlug, "Brend" | "Pomoć" | "Pravno"> = {
  "o-nama": "Brend",
  saradnja: "Brend",
  kontakt: "Pomoć",
  dostava: "Pomoć",
  "reklamacije-i-povracaj": "Pomoć",
  "uslovi-koriscenja": "Pravno",
  privatnost: "Pravno",
  kolacici: "Pravno",
};

type Draft = Omit<PageContent, "slug" | "updatedAt">;

export const PAGE_DRAFTS: Record<PageSlug, Draft> = {
  "o-nama": {
    title: "O nama",
    intro:
      "monahome je mala prodavnica predmeta za dom, nastala iz uverenja da se dom gradi od sitnica koje koristimo svakog dana.",
    seoDescription: "Ko stoji iza monahome: pažljivo birani tekstil i predmeti za dom, u toplim i prirodnim tonovima.",
    body: `## Kako biramo
Ne pravimo beskrajan katalog. Svake sezone biramo mali broj komada koje bismo i sami imali u svom domu: peškire koji su mekani i posle mnogo pranja, pledove u koje se rado umotate, predmete koji se slažu jedni s drugima.

## Šta nam je važno
- Prirodni materijali i dobar osećaj na dodir
- Tople nijanse kamena, drveta i espresa
- Mali broj pažljivo biranih komada, umesto mnoštva prosečnih

## Iza monahome
Iza prodavnice stoji mali tim koji lično pregleda svaki komad pre slanja. Ako imate pitanje ili predlog, rado ćemo Vas čuti na [office@monahome.rs](mailto:office@monahome.rs).`,
  },

  kontakt: {
    title: "Kontakt",
    intro: "Tu smo za sva pitanja o proizvodima, porudžbinama i dostavi.",
    seoDescription: "Kontakt monahome prodavnice: e-mail, telefon i društvene mreže.",
    body: `## Kada odgovaramo
Na poruke odgovaramo radnim danima od 9 do 17 časova, najkasnije narednog radnog dana.

## Pitanje o porudžbini
Ako pišete u vezi sa porudžbinom, navedite njen broj (npr. MH-1001). Broj se nalazi u potvrdi koju ste dobili e-mailom.

## Podaci o prodavcu
[NAZIV FIRME]
[ADRESA]
PIB: [PIB] · Matični broj: [MATIČNI BROJ]`,
  },

  dostava: {
    title: "Dostava",
    intro: "Porudžbine šaljemo kurirskom službom na adresu u Srbiji. Plaćanje se vrši pouzećem, prilikom preuzimanja.",
    seoDescription: "Rok, cena i način dostave monahome porudžbina. Plaćanje pouzećem.",
    body: `## Rok isporuke
Porudžbinu potvrđujemo telefonom ili e-mailom, a zatim je predajemo kurirskoj službi. Isporuka traje od 2 do 4 radna dana od potvrde.

## Cena dostave
- Cena dostave: [CENA DOSTAVE]
- Besplatna dostava za porudžbine preko [IZNOS]

## Plaćanje
Plaćanje se vrši pouzećem: iznos porudžbine i dostave plaćate kuriru prilikom preuzimanja, gotovinom.

## Preuzimanje pošiljke
Kurir Vas kontaktira pre isporuke. Molimo Vas da pri preuzimanju proverite da li je paket oštećen. Ako jeste, sačinite zapisnik sa kurirom i javite nam se na [office@monahome.rs](mailto:office@monahome.rs).

## Praćenje pošiljke
Kada porudžbinu predamo kuriru, poslaćemo Vam e-mail sa nazivom kurirske službe i brojem pošiljke.`,
  },

  "reklamacije-i-povracaj": {
    title: "Reklamacije i povraćaj",
    intro: "Ako niste zadovoljni kupovinom, imate pravo da odustanete od ugovora ili da izjavite reklamaciju.",
    seoDescription: "Odustanak od kupovine u roku od 14 dana i postupak reklamacije u monahome prodavnici.",
    body: `## Odustanak od kupovine (14 dana)
Proizvod kupljen preko sajta možete vratiti bez navođenja razloga, u roku od 14 dana od dana kada ste ga primili.

1. Pošaljite nam izjavu o odustanku na [office@monahome.rs](mailto:office@monahome.rs), sa brojem porudžbine.
2. Proizvod vratite u roku od 14 dana od slanja izjave, nekorišćen i u originalnom pakovanju.
3. Novac Vam vraćamo najkasnije u roku od 14 dana od prijema izjave, na račun koji navedete.

Troškove vraćanja proizvoda snosi kupac, osim ako je proizvod oštećen ili pogrešno poslat.

## Reklamacija
Ako proizvod ima nedostatak, reklamaciju možete izjaviti e-mailom na [office@monahome.rs](mailto:office@monahome.rs). Uz reklamaciju pošaljite broj porudžbine, opis nedostatka i fotografiju.

- Prijem reklamacije potvrđujemo bez odlaganja
- Odgovor na reklamaciju dajemo najkasnije u roku od 8 dana
- Rešavamo je najkasnije u roku od 15 dana: popravkom, zamenom ili povraćajem novca

## Prodavac
[NAZIV FIRME], [ADRESA], PIB: [PIB]`,
  },

  "uslovi-koriscenja": {
    title: "Uslovi kupovine",
    intro: "Ovi uslovi važe za kupovinu na sajtu monahome.rs. Potvrdom porudžbine prihvatate ih u celosti.",
    seoDescription: "Uslovi kupovine na sajtu monahome.rs: porudžbina, cene, plaćanje, dostava i prava kupaca.",
    body: `## Prodavac
Prodavac je [NAZIV FIRME], sa sedištem na adresi [ADRESA], PIB: [PIB], matični broj: [MATIČNI BROJ]. Kontakt: [office@monahome.rs](mailto:office@monahome.rs), +381 65 3464 857.

## Porudžbina
Porudžbinu pravite dodavanjem proizvoda u korpu i potvrdom na stranici za plaćanje. Nakon porudžbine dobijate potvrdu e-mailom. Ugovor je zaključen kada porudžbinu potvrdimo telefonom ili e-mailom.

## Cene
Sve cene su izražene u dinarima (RSD) i sadrže PDV. Cena dostave prikazuje se pre potvrde porudžbine. Zadržavamo pravo izmene cena; za porudžbinu važi cena u trenutku njenog slanja.

## Plaćanje i dostava
Plaćanje se vrši pouzećem, kuriru prilikom preuzimanja. Rokovi i cena dostave opisani su na stranici [Dostava](/dostava).

## Dostupnost proizvoda
Trudimo se da stanje na sajtu bude tačno. Ako proizvod ipak nije dostupan, obavestićemo Vas i ponuditi zamenu ili otkazivanje porudžbine.

## Odustanak i reklamacije
Prava na odustanak u roku od 14 dana i na reklamaciju opisana su na stranici [Reklamacije i povraćaj](/reklamacije-i-povracaj).

## Zaštita podataka
Podatke koje unesete koristimo samo za obradu porudžbine, kako je opisano u [Politici privatnosti](/privatnost).

## Rešavanje sporova
Sve nesporazume nastojimo da rešimo dogovorom. Kupac može podneti i predlog za vansudsko rešavanje potrošačkog spora, u skladu sa Zakonom o zaštiti potrošača.`,
  },

  privatnost: {
    title: "Politika privatnosti",
    intro: "Opisujemo koje podatke prikupljamo, zašto i koliko ih čuvamo, i koja su Vaša prava.",
    seoDescription: "Kako monahome prikuplja, koristi i čuva podatke o ličnosti kupaca.",
    body: `## Rukovalac podacima
Rukovalac podacima je [NAZIV FIRME], [ADRESA], PIB: [PIB]. Za sva pitanja o podacima pišite na [office@monahome.rs](mailto:office@monahome.rs).

## Koje podatke prikupljamo
- Ime i prezime, adresu, telefon i e-mail, kada napravite porudžbinu
- E-mail adresu, kada se prijavite na novosti
- Tehničke podatke potrebne za rad sajta (npr. sadržaj korpe u Vašem pregledaču)

## Zašto ih koristimo
- Za obradu i isporuku porudžbine i kontakt u vezi sa njom
- Za slanje novosti, samo ako ste se na njih prijavili
- Za ispunjenje zakonskih obaveza (npr. računovodstvo)

## Kome ih prosleđujemo
Podatke prosleđujemo samo onima bez kojih porudžbina ne može biti izvršena: kurirskoj službi (ime, adresa, telefon) i pružaocima tehničkih usluga (hosting sajta i slanje e-mailova). Podatke ne prodajemo i ne ustupamo u marketinške svrhe.

## Koliko ih čuvamo
Podatke o porudžbinama čuvamo onoliko koliko zahtevaju propisi. E-mail za novosti čuvamo dok se ne odjavite.

## Vaša prava
Imate pravo da zatražite uvid u svoje podatke, njihovu ispravku ili brisanje, da se odjavite sa novosti i da podnesete pritužbu Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti.`,
  },

  kolacici: {
    title: "Kolačići",
    intro: "Sajt koristi samo ono što je neophodno da bi radio.",
    seoDescription: "Koje kolačiće i lokalno skladište koristi sajt monahome.rs.",
    body: `## Šta koristimo
- **Korpa:** sadržaj korpe čuva se u Vašem pregledaču (lokalno skladište), da ne nestane kada zatvorite stranicu
- **Prijava:** kolačić sesije, samo kada se prijavite na nalog

Ovi podaci su neophodni za rad sajta i ne koriste se za praćenje niti za oglašavanje.

## Analitika i oglasi
Trenutno ne koristimo kolačiće za analitiku ni za oglašavanje. Ako ih uvedemo, ovde ćemo to navesti i tražiti Vašu saglasnost pre upotrebe.

## Kako da ih obrišete
Kolačiće i lokalno skladište možete obrisati u podešavanjima svog pregledača. Tada se prazni i korpa.`,
  },

  saradnja: {
    title: "Saradnja",
    intro: "Sarađujemo sa autorima sadržaja, stilistima i prostorima koji dele naš pogled na dom.",
    seoDescription: "Saradnja sa monahome: autori sadržaja, stilisti i poslovni partneri.",
    body: `## Autori sadržaja
Ako stvarate sadržaj o enterijeru, svakodnevnim ritualima ili životnom stilu, rado ćemo razgovarati o saradnji. Pišite nam uz link ka svom profilu.

## Poslovni partneri
Stilistima, dekoraterima i prostorima (kafići, apartmani, studiji) nudimo posebne uslove za veće porudžbine.

## Kontakt
Pišite na [office@monahome.rs](mailto:office@monahome.rs), uz kratak opis predloga. Odgovaramo u roku od nekoliko radnih dana.`,
  },
};

/** Nacrt stranice kao gotov sadržaj (kada u bazi još nema izmenjene verzije). */
export function draftPage(slug: PageSlug): PageContent {
  return { slug, ...PAGE_DRAFTS[slug], updatedAt: null };
}