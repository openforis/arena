import * as R from 'ramda'

const languagesMap = {
  ab: { en: 'Abkhazian' },
  aa: { en: 'Afar' },
  af: { en: 'Afrikaans' },
  ak: { en: 'Akan' },
  sq: { en: 'Albanian' },
  am: { en: 'Amharic' },
  ar: { en: 'Arabic' },
  an: { en: 'Aragonese' },
  hy: { en: 'Armenian' },
  as: { en: 'Assamese' },
  av: { en: 'Avaric' },
  ay: { en: 'Aymara' },
  az: { en: 'Azerbaijani' },
  bm: { en: 'Bambara' },
  ba: { en: 'Bashkir' },
  eu: { en: 'Basque' },
  be: { en: 'Belarusian' },
  bn: { en: 'Bengali' },
  bi: { en: 'Bislama' },
  nb: { en: 'Bokmål, Norwegian; Norwegian Bokmål' },
  bs: { en: 'Bosnian' },
  br: { en: 'Breton' },
  bg: { en: 'Bulgarian' },
  my: { en: 'Burmese' },
  ca: { en: 'Catalan; Valencian' },
  km: { en: 'Central Khmer' },
  ch: { en: 'Chamorro' },
  ce: { en: 'Chechen' },
  ny: { en: 'Chichewa; Chewa; Nyanja' },
  zh: { en: 'Chinese' },
  cv: { en: 'Chuvash' },
  kw: { en: 'Cornish' },
  co: { en: 'Corsican' },
  cr: { en: 'Cree' },
  hr: { en: 'Croatian' },
  cs: { en: 'Czech' },
  da: { en: 'Danish' },
  dv: { en: 'Divehi; Dhivehi; Maldivian' },
  nl: { en: 'Dutch; Flemish' },
  dz: { en: 'Dzongkha' },
  en: { en: 'English' },
  eo: { en: 'Esperanto' },
  et: { en: 'Estonian' },
  ee: { en: 'Ewe' },
  fo: { en: 'Faroese' },
  fj: { en: 'Fijian' },
  fi: { en: 'Finnish' },
  fr: { en: 'French' },
  ff: { en: 'Fulah' },
  gd: { en: 'Gaelic; Scottish Gaelic' },
  gl: { en: 'Galician' },
  lg: { en: 'Ganda' },
  ka: { en: 'Georgian' },
  de: { en: 'German' },
  el: { en: 'Greek, Modern (1453-)' },
  gn: { en: 'Guarani' },
  gu: { en: 'Gujarati' },
  ht: { en: 'Haitian; Haitian Creole' },
  ha: { en: 'Hausa' },
  he: { en: 'Hebrew' },
  hz: { en: 'Herero' },
  hi: { en: 'Hindi' },
  ho: { en: 'Hiri Motu' },
  hu: { en: 'Hungarian' },
  is: { en: 'Icelandic' },
  io: { en: 'Ido' },
  ig: { en: 'Igbo' },
  id: { en: 'Indonesian' },
  ia: { en: 'Interlingua (International Auxiliary Language Association)' },
  ie: { en: 'Interlingue; Occidental' },
  iu: { en: 'Inuktitut' },
  ik: { en: 'Inupiaq' },
  ga: { en: 'Irish' },
  it: { en: 'Italian' },
  ja: { en: 'Japanese' },
  jv: { en: 'Javanese' },
  kl: { en: 'Kalaallisut; Greenlandic' },
  kn: { en: 'Kannada' },
  kr: { en: 'Kanuri' },
  ks: { en: 'Kashmiri' },
  kk: { en: 'Kazakh' },
  ki: { en: 'Kikuyu; Gikuyu' },
  rw: { en: 'Kinyarwanda' },
  ky: { en: 'Kirghiz; Kyrgyz' },
  kv: { en: 'Komi' },
  kg: { en: 'Kongo' },
  ko: { en: 'Korean' },
  kj: { en: 'Kuanyama; Kwanyama' },
  ku: { en: 'Kurdish' },
  lo: { en: 'Lao' },
  lv: { en: 'Latvian' },
  li: { en: 'Limburgan; Limburger; Limburgish' },
  ln: { en: 'Lingala' },
  lt: { en: 'Lithuanian' },
  lu: { en: 'Luba-Katanga' },
  lb: { en: 'Luxembourgish; Letzeburgesch' },
  mk: { en: 'Macedonian' },
  mg: { en: 'Malagasy' },
  ms: { en: 'Malay' },
  ml: { en: 'Malayalam' },
  mt: { en: 'Maltese' },
  gv: { en: 'Manx' },
  mi: { en: 'Maori' },
  mr: { en: 'Marathi' },
  mh: { en: 'Marshallese' },
  mn: { en: 'Mongolian' },
  na: { en: 'Nauru' },
  nv: { en: 'Navajo; Navaho' },
  nd: { en: 'Ndebele, North; North Ndebele' },
  nr: { en: 'Ndebele, South; South Ndebele' },
  ng: { en: 'Ndonga' },
  ne: { en: 'Nepali' },
  se: { en: 'Northern Sami' },
  no: { en: 'Norwegian' },
  nn: { en: 'Norwegian Nynorsk; Nynorsk, Norwegian' },
  oc: { en: 'Occitan (post 1500); Provençal' },
  oj: { en: 'Ojibwa' },
  or: { en: 'Oriya' },
  om: { en: 'Oromo' },
  os: { en: 'Ossetian; Ossetic' },
  pa: { en: 'Panjabi; Punjabi' },
  fa: { en: 'Persian' },
  pl: { en: 'Polish' },
  pt: { en: 'Portuguese' },
  ps: { en: 'Pushto; Pashto' },
  qu: { en: 'Quechua' },
  ro: { en: 'Romanian; Moldavian; Moldovan' },
  rm: { en: 'Romansh' },
  rn: { en: 'Rundi' },
  ru: { en: 'Russian' },
  sm: { en: 'Samoan' },
  sg: { en: 'Sango' },
  sc: { en: 'Sardinian' },
  sr: { en: 'Serbian' },
  sn: { en: 'Shona' },
  ii: { en: 'Sichuan Yi; Nuosu' },
  sd: { en: 'Sindhi' },
  si: { en: 'Sinhala; Sinhalese' },
  sk: { en: 'Slovak' },
  sl: { en: 'Slovenian' },
  so: { en: 'Somali' },
  st: { en: 'Sotho, Southern' },
  es: { en: 'Spanish; Castilian' },
  su: { en: 'Sundanese' },
  sw: { en: 'Swahili' },
  ss: { en: 'Swati' },
  sv: { en: 'Swedish' },
  tl: { en: 'Tagalog' },
  ty: { en: 'Tahitian' },
  tg: { en: 'Tajik' },
  ta: { en: 'Tamil' },
  tt: { en: 'Tatar' },
  te: { en: 'Telugu' },
  th: { en: 'Thai' },
  bo: { en: 'Tibetan' },
  ti: { en: 'Tigrinya' },
  to: { en: 'Tonga (Tonga Islands)' },
  ts: { en: 'Tsonga' },
  tn: { en: 'Tswana' },
  tr: { en: 'Turkish' },
  tk: { en: 'Turkmen' },
  tw: { en: 'Twi' },
  ug: { en: 'Uighur; Uyghur' },
  uk: { en: 'Ukrainian' },
  ur: { en: 'Urdu' },
  uz: { en: 'Uzbek' },
  ve: { en: 'Venda' },
  vi: { en: 'Vietnamese' },
  vo: { en: 'Volapük' },
  wa: { en: 'Walloon' },
  cy: { en: 'Welsh' },
  fy: { en: 'Western Frisian' },
  wo: { en: 'Wolof' },
  xh: { en: 'Xhosa' },
  yi: { en: 'Yiddish' },
  yo: { en: 'Yoruba' },
  za: { en: 'Zhuang; Chuang' },
  zu: { en: 'Zulu' },
}

const iso639part2Names = {
  aar: { en: 'Afar' },
  abk: { en: 'Abkhazian' },
  ace: { en: 'Achinese' },
  ach: { en: 'Acoli' },
  ada: { en: 'Adangme' },
  ady: { en: 'Adyghe; Adygei' },
  afh: { en: 'Afrihili' },
  afr: { en: 'Afrikaans' },
  ain: { en: 'Ainu' },
  aka: { en: 'Akan' },
  alb: { en: 'Albanian' },
  ale: { en: 'Aleut' },
  alt: { en: 'Southern Altai' },
  amh: { en: 'Amharic' },
  anp: { en: 'Angika' },
  ara: { en: 'Arabic' },
  arg: { en: 'Aragonese' },
  arm: { en: 'Armenian' },
  arn: { en: 'Mapudungun; Mapuche' },
  arp: { en: 'Arapaho' },
  arw: { en: 'Arawak' },
  asm: { en: 'Assamese' },
  ast: { en: 'Asturian; Bable; Leonese; Asturleonese' },
  ava: { en: 'Avaric' },
  awa: { en: 'Awadhi' },
  aym: { en: 'Aymara' },
  aze: { en: 'Azerbaijani' },
  bak: { en: 'Bashkir' },
  bal: { en: 'Baluchi' },
  bam: { en: 'Bambara' },
  ban: { en: 'Balinese' },
  baq: { en: 'Basque' },
  bas: { en: 'Basa' },
  bej: { en: 'Beja; Bedawiyet' },
  bel: { en: 'Belarusian' },
  bem: { en: 'Bemba' },
  ben: { en: 'Bengali' },
  bho: { en: 'Bhojpuri' },
  bik: { en: 'Bikol' },
  bin: { en: 'Bini; Edo' },
  bis: { en: 'Bislama' },
  bla: { en: 'Siksika' },
  bod: { en: 'Tibetan (T)' },
  bos: { en: 'Bosnian' },
  bra: { en: 'Braj' },
  bre: { en: 'Breton' },
  bua: { en: 'Buriat' },
  bug: { en: 'Buginese' },
  bul: { en: 'Bulgarian' },
  bur: { en: 'Burmese' },
  byn: { en: 'Blin; Bilin' },
  cad: { en: 'Caddo' },
  car: { en: 'Galibi Carib' },
  cat: { en: 'Catalan; Valencian' },
  ceb: { en: 'Cebuano' },
  ces: { en: 'Czech (T)' },
  cha: { en: 'Chamorro' },
  che: { en: 'Chechen' },
  chi: { en: 'Chinese' },
  chk: { en: 'Chuukese' },
  chm: { en: 'Mari' },
  chn: { en: 'Chinook jargon' },
  cho: { en: 'Choctaw' },
  chp: { en: 'Chipewyan; Dene Suline' },
  chr: { en: 'Cherokee' },
  chv: { en: 'Chuvash' },
  chy: { en: 'Cheyenne' },
  cnr: { en: 'Montenegrin' },
  cor: { en: 'Cornish' },
  cos: { en: 'Corsican' },
  cre: { en: 'Cree' },
  crh: { en: 'Crimean Tatar; Crimean Turkish' },
  csb: { en: 'Kashubian' },
  cym: { en: 'Welsh (T)' },
  cze: { en: 'Czech' },
  dak: { en: 'Dakota' },
  dan: { en: 'Danish' },
  dar: { en: 'Dargwa' },
  del: { en: 'Delaware' },
  den: { en: 'Slave (Athapascan)' },
  deu: { en: 'German (T)' },
  dgr: { en: 'Dogrib' },
  din: { en: 'Dinka' },
  div: { en: 'Divehi; Dhivehi; Maldivian' },
  doi: { en: 'Dogri' },
  dsb: { en: 'Lower Sorbian' },
  dua: { en: 'Duala' },
  dut: { en: 'Dutch; Flemish' },
  dyu: { en: 'Dyula' },
  dzo: { en: 'Dzongkha' },
  efi: { en: 'Efik' },
  eka: { en: 'Ekajuk' },
  ell: { en: 'Greek, Modern (1453-) (T)' },
  eng: { en: 'English' },
  epo: { en: 'Esperanto' },
  est: { en: 'Estonian' },
  eus: { en: 'Basque (T)' },
  ewe: { en: 'Ewe' },
  ewo: { en: 'Ewondo' },
  fan: { en: 'Fang' },
  fao: { en: 'Faroese' },
  fas: { en: 'Persian (T)' },
  fat: { en: 'Fanti' },
  fij: { en: 'Fijian' },
  fil: { en: 'Filipino; Pilipino' },
  fin: { en: 'Finnish' },
  fon: { en: 'Fon' },
  fra: { en: 'French (T)' },
  fre: { en: 'French (B)' },
  frr: { en: 'Northern Frisian' },
  frs: { en: 'Eastern Frisian' },
  fry: { en: 'Western Frisian' },
  ful: { en: 'Fulah' },
  fur: { en: 'Friulian' },
  gaa: { en: 'Ga' },
  gay: { en: 'Gayo' },
  gba: { en: 'Gbaya' },
  geo: { en: 'Georgian' },
  ger: { en: 'German' },
  gil: { en: 'Gilbertese' },
  gla: { en: 'Gaelic; Scottish Gaelic' },
  gle: { en: 'Irish' },
  glg: { en: 'Galician' },
  glv: { en: 'Manx' },
  gon: { en: 'Gondi' },
  gor: { en: 'Gorontalo' },
  grb: { en: 'Grebo' },
  gre: { en: 'Greek, Modern (1453-)' },
  grn: { en: 'Guarani' },
  gsw: { en: 'Swiss German; Alemannic; Alsatian' },
  guj: { en: 'Gujarati' },
  gwi: { en: "Gwich'in" },
  hai: { en: 'Haida' },
  hat: { en: 'Haitian; Haitian Creole' },
  hau: { en: 'Hausa' },
  haw: { en: 'Hawaiian' },
  heb: { en: 'Hebrew' },
  her: { en: 'Herero' },
  hil: { en: 'Hiligaynon' },
  hin: { en: 'Hindi' },
  hmn: { en: 'Hmong; Mong' },
  hmo: { en: 'Hiri Motu' },
  hrv: { en: 'Croatian' },
  hsb: { en: 'Upper Sorbian' },
  hun: { en: 'Hungarian' },
  hup: { en: 'Hupa' },
  hye: { en: 'Armenian (T)' },
  iba: { en: 'Iban' },
  ibo: { en: 'Igbo' },
  ice: { en: 'Icelandic' },
  ido: { en: 'Ido' },
  iii: { en: 'Sichuan Yi; Nuosu' },
  iku: { en: 'Inuktitut' },
  ile: { en: 'Interlingue; Occidental' },
  ilo: { en: 'Iloko' },
  ina: { en: 'Interlingua (International Auxiliary Language Association)' },
  ind: { en: 'Indonesian' },
  inh: { en: 'Ingush' },
  ipk: { en: 'Inupiaq' },
  isl: { en: 'Icelandic (T)' },
  ita: { en: 'Italian' },
  jav: { en: 'Javanese' },
  jbo: { en: 'Lojban' },
  jpn: { en: 'Japanese' },
  jpr: { en: 'Judeo-Persian' },
  jrb: { en: 'Judeo-Arabic' },
  kaa: { en: 'Kara-Kalpak' },
  kab: { en: 'Kabyle' },
  kac: { en: 'Kachin; Jingpho' },
  kal: { en: 'Kalaallisut; Greenlandic' },
  kam: { en: 'Kamba' },
  kan: { en: 'Kannada' },
  kas: { en: 'Kashmiri' },
  kat: { en: 'Georgian (T)' },
  kau: { en: 'Kanuri' },
  kaz: { en: 'Kazakh' },
  kbd: { en: 'Kabardian' },
  kha: { en: 'Khasi' },
  khm: { en: 'Central Khmer' },
  kik: { en: 'Kikuyu; Gikuyu' },
  kin: { en: 'Kinyarwanda' },
  kir: { en: 'Kirghiz; Kyrgyz' },
  kmb: { en: 'Kimbundu' },
  kok: { en: 'Konkani' },
  kom: { en: 'Komi' },
  kon: { en: 'Kongo' },
  kor: { en: 'Korean' },
  kos: { en: 'Kosraean' },
  kpe: { en: 'Kpelle' },
  krc: { en: 'Karachay-Balkar' },
  krl: { en: 'Karelian' },
  kru: { en: 'Kurukh' },
  kua: { en: 'Kuanyama; Kwanyama' },
  kum: { en: 'Kumyk' },
  kur: { en: 'Kurdish' },
  kut: { en: 'Kutenai' },
  lad: { en: 'Ladino' },
  lah: { en: 'Lahnda' },
  lam: { en: 'Lamba' },
  lao: { en: 'Lao' },
  lav: { en: 'Latvian' },
  lez: { en: 'Lezghian' },
  lim: { en: 'Limburgan; Limburger; Limburgish' },
  lin: { en: 'Lingala' },
  lit: { en: 'Lithuanian' },
  lol: { en: 'Mongo' },
  loz: { en: 'Lozi' },
  ltz: { en: 'Luxembourgish; Letzeburgesch' },
  lua: { en: 'Luba-Lulua' },
  lub: { en: 'Luba-Katanga' },
  lug: { en: 'Ganda' },
  lun: { en: 'Lunda' },
  luo: { en: 'Luo (Kenya and Tanzania)' },
  lus: { en: 'Lushai' },
  mac: { en: 'Macedonian' },
  mad: { en: 'Madurese' },
  mag: { en: 'Magahi' },
  mah: { en: 'Marshallese' },
  mai: { en: 'Maithili' },
  mak: { en: 'Makasar' },
  mal: { en: 'Malayalam' },
  man: { en: 'Mandingo' },
  mao: { en: 'Maori' },
  mar: { en: 'Marathi' },
  mas: { en: 'Masai' },
  may: { en: 'Malay' },
  mdf: { en: 'Moksha' },
  mdr: { en: 'Mandar' },
  men: { en: 'Mende' },
  mic: { en: "Mi'kmaq; Micmac" },
  min: { en: 'Minangkabau' },
  mis: { en: 'Uncoded languages' },
  mkd: { en: 'Macedonian (T)' },
  mlg: { en: 'Malagasy' },
  mlt: { en: 'Maltese' },
  mnc: { en: 'Manchu' },
  mni: { en: 'Manipuri' },
  moh: { en: 'Mohawk' },
  mon: { en: 'Mongolian' },
  mos: { en: 'Mossi' },
  mri: { en: 'Maori (T)' },
  msa: { en: 'Malay (T)' },
  mul: { en: 'Multiple languages' },
  mus: { en: 'Creek' },
  mwl: { en: 'Mirandese' },
  mwr: { en: 'Marwari' },
  mya: { en: 'Burmese (T)' },
  myv: { en: 'Erzya' },
  nap: { en: 'Neapolitan' },
  nau: { en: 'Nauru' },
  nav: { en: 'Navajo; Navaho' },
  nbl: { en: 'Ndebele, South; South Ndebele' },
  nde: { en: 'Ndebele, North; North Ndebele' },
  ndo: { en: 'Ndonga' },
  nds: { en: 'Low German; Low Saxon; German, Low; Saxon, Low' },
  nep: { en: 'Nepali' },
  new: { en: 'Nepal Bhasa; Newari' },
  nia: { en: 'Nias' },
  niu: { en: 'Niuean' },
  nld: { en: 'Dutch; Flemish (T)' },
  nno: { en: 'Norwegian Nynorsk; Nynorsk, Norwegian' },
  nob: { en: 'Bokmål, Norwegian; Norwegian Bokmål' },
  nog: { en: 'Nogai' },
  nor: { en: 'Norwegian' },
  nqo: { en: "N'Ko" },
  nso: { en: 'Pedi; Sepedi; Northern Sotho' },
  nya: { en: 'Chichewa; Chewa; Nyanja' },
  nym: { en: 'Nyamwezi' },
  nyn: { en: 'Nyankole' },
  nyo: { en: 'Nyoro' },
  nzi: { en: 'Nzima' },
  oci: { en: 'Occitan (post 1500)' },
  oji: { en: 'Ojibwa' },
  ori: { en: 'Oriya' },
  orm: { en: 'Oromo' },
  osa: { en: 'Osage' },
  oss: { en: 'Ossetian; Ossetic' },
  pag: { en: 'Pangasinan' },
  pam: { en: 'Pampanga; Kapampangan' },
  pan: { en: 'Panjabi; Punjabi' },
  pap: { en: 'Papiamento' },
  pau: { en: 'Palauan' },
  per: { en: 'Persian' },
  pol: { en: 'Polish' },
  pon: { en: 'Pohnpeian' },
  por: { en: 'Portuguese' },
  pus: { en: 'Pushto; Pashto' },
  que: { en: 'Quechua' },
  raj: { en: 'Rajasthani' },
  rap: { en: 'Rapanui' },
  rar: { en: 'Rarotongan; Cook Islands Maori' },
  roh: { en: 'Romansh' },
  rom: { en: 'Romany' },
  ron: { en: 'Romanian; Moldavian; Moldovan (T)' },
  rum: { en: 'Romanian; Moldavian; Moldovan' },
  run: { en: 'Rundi' },
  rup: { en: 'Aromanian; Arumanian; Macedo-Romanian' },
  rus: { en: 'Russian' },
  sad: { en: 'Sandawe' },
  sag: { en: 'Sango' },
  sah: { en: 'Yakut' },
  sas: { en: 'Sasak' },
  sat: { en: 'Santali' },
  scn: { en: 'Sicilian' },
  sco: { en: 'Scots' },
  sel: { en: 'Selkup' },
  shn: { en: 'Shan' },
  sid: { en: 'Sidamo' },
  sin: { en: 'Sinhala; Sinhalese' },
  slk: { en: 'Slovak (T)' },
  slo: { en: 'Slovak' },
  slv: { en: 'Slovenian' },
  sma: { en: 'Southern Sami' },
  sme: { en: 'Northern Sami' },
  smj: { en: 'Lule Sami' },
  smn: { en: 'Inari Sami' },
  smo: { en: 'Samoan' },
  sms: { en: 'Skolt Sami' },
  sna: { en: 'Shona' },
  snd: { en: 'Sindhi' },
  snk: { en: 'Soninke' },
  som: { en: 'Somali' },
  sot: { en: 'Sotho, Southern' },
  spa: { en: 'Spanish; Castilian' },
  sqi: { en: 'Albanian (T)' },
  srd: { en: 'Sardinian' },
  srn: { en: 'Sranan Tongo' },
  srp: { en: 'Serbian' },
  srr: { en: 'Serer' },
  ssw: { en: 'Swati' },
  suk: { en: 'Sukuma' },
  sun: { en: 'Sundanese' },
  sus: { en: 'Susu' },
  swa: { en: 'Swahili' },
  swe: { en: 'Swedish' },
  syr: { en: 'Syriac' },
  tah: { en: 'Tahitian' },
  tam: { en: 'Tamil' },
  tat: { en: 'Tatar' },
  tel: { en: 'Telugu' },
  tem: { en: 'Timne' },
  ter: { en: 'Tereno' },
  tet: { en: 'Tetum' },
  tgk: { en: 'Tajik' },
  tgl: { en: 'Tagalog' },
  tha: { en: 'Thai' },
  tib: { en: 'Tibetan' },
  tig: { en: 'Tigre' },
  tir: { en: 'Tigrinya' },
  tiv: { en: 'Tiv' },
  tkl: { en: 'Tokelau' },
  tlh: { en: 'Klingon; tlhIngan-Hol' },
  tli: { en: 'Tlingit' },
  tmh: { en: 'Tamashek' },
  tog: { en: 'Tonga (Nyasa)' },
  ton: { en: 'Tonga (Tonga Islands)' },
  tpi: { en: 'Tok Pisin' },
  tsi: { en: 'Tsimshian' },
  tsn: { en: 'Tswana' },
  tso: { en: 'Tsonga' },
  tuk: { en: 'Turkmen' },
  tum: { en: 'Tumbuka' },
  tur: { en: 'Turkish' },
  tvl: { en: 'Tuvalu' },
  twi: { en: 'Twi' },
  tyv: { en: 'Tuvinian' },
  udm: { en: 'Udmurt' },
  uig: { en: 'Uighur; Uyghur' },
  ukr: { en: 'Ukrainian' },
  umb: { en: 'Umbundu' },
  und: { en: 'Undetermined' },
  urd: { en: 'Urdu' },
  uzb: { en: 'Uzbek' },
  vai: { en: 'Vai' },
  ven: { en: 'Venda' },
  vie: { en: 'Vietnamese' },
  vol: { en: 'Volapük' },
  vot: { en: 'Votic' },
  wal: { en: 'Wolaitta; Wolaytta' },
  war: { en: 'Waray' },
  was: { en: 'Washo' },
  wel: { en: 'Welsh' },
  wln: { en: 'Walloon' },
  wol: { en: 'Wolof' },
  xal: { en: 'Kalmyk; Oirat' },
  xho: { en: 'Xhosa' },
  yao: { en: 'Yao' },
  yap: { en: 'Yapese' },
  yid: { en: 'Yiddish' },
  yor: { en: 'Yoruba' },
  zap: { en: 'Zapotec' },
  zbl: { en: 'Blissymbols; Blissymbolics; Bliss' },
  zen: { en: 'Zenaga' },
  zgh: { en: 'Standard Moroccan Tamazight' },
  zha: { en: 'Zhuang; Chuang' },
  zho: { en: 'Chinese (T)' },
  zul: { en: 'Zulu' },
  zun: { en: 'Zuni' },
  zxx: { en: 'No linguistic content; Not applicable' },
  zza: { en: 'Zaza; Dimili; Dimli; Kirdki; Kirmanjki; Zazaki' },
}

const availableTranslationLanguages = ['en']

export const getLanguageLabel = (lang, translationLang = 'en') => {
  const translationLanguage = availableTranslationLanguages.includes(translationLang) ? translationLang : 'en'
  return R.path([lang, translationLanguage], languagesMap)
}

export const getLanguageISO639part2Label = (lang, translationLang = 'en') => {
  const translationLanguage = availableTranslationLanguages.includes(translationLang) ? translationLang : 'en'
  return R.path([lang, translationLanguage], iso639part2Names)
}

export const languages = R.pipe(
  R.keys,
  R.map((lang) => ({ value: lang, label: getLanguageLabel(lang) }))
)(languagesMap)

export const languageCodes = languages.map(R.prop('value'))

export const languageCodesISO639part2 = R.keys(iso639part2Names)
