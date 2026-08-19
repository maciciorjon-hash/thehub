# Revisión de la migración de protocolos

Generado por `migrate_protocols.py`. El parser saca la estructura; **nombrar los parámetros
y fijar el `day` de cada etapa es trabajo humano** — esta es la lista para hacerlo.

Round-trip verificado: **33/33 protocolos** conservan cada palabra del panel original.
Totales: **153 etapas**, **565 parámetros** a nombrar.


Para cada etapa: `day` es el día relativo al inicio del experimento (0 = primer día).
El migrador los deja todos a 0 salvo donde el protocolo ya marcaba pasos por día.
Para cada parámetro: sustituye `TODO: …` por una etiqueta corta y legible.

## Gibson Assembly  (`gibson`)

- **Overview — the 3-step workflow** — `day: 0` · 0 paso(s) · 1 callout(s): note
- **1 — Design overlapping primers (before PCR)** — `day: 0` · 3 paso(s) · 1 callout(s): warn
    - `valRange` = 15.0 – 30.0 bp  ·  TODO: ⟨15–30 bp⟩
    - `bindingRegionTmT` = 60.0 °C  ·  TODO: region Tm ⟨60°C⟩ and the
- **2 — PCR → DpnI → gel purification (one continuous workflow)** — `day: 0` · 4 paso(s)
    - `exchangeNeededIncubateT` = 37.0 °C  ·  TODO: needed Incubate ⟨37°C⟩ min
    - `exchangeNeededIncubateMin` = 60.0 min  ·  TODO: needed Incubate ⟨60 min⟩
    - `valX` = 6.0 ×  ·  TODO: Add ⟨6×⟩ DNA loading
    - `wholeThingPct` = 1.0 %  ·  TODO: thing on ⟨1%⟩ agarose gel
- **3 — Gibson assembly reaction** — `day: 0` · 4 paso(s) · 1 callout(s): tip
    - `firstNebhifiX` = 2.0 ×  ·  TODO: add NEBHiFi ⟨2×⟩ Master Mix
    - `bpAimAmt` = 0.06 pmol  ·  TODO: aim for ⟨0.06 pmol⟩ vector molar
    - `aimVectorX` = 2.0 ×  ·  TODO: for vector ⟨2×⟩ molar excess
    - `incubateT` = 50.0 °C  ·  TODO: Incubate at ⟨50°C⟩
    - `valMin` = 15.0 min  ·  TODO: ⟨15 min⟩
    - `valMin2` = 60.0 min  ·  TODO: ⟨60 min⟩
    - `iceT` = -20.0 °C  ·  TODO: or at ⟨−20°C⟩ Transform uL
    - `transformVol` = 2.0 uL  ·  TODO: at Transform ⟨2 uL⟩ into competent

## Restriction Enzyme Cloning (NEB)  (`redigest`)

- **1 — Choose your enzymes** — `day: 0` · 4 paso(s) · 1 callout(s): warn
- **2 — Digest reaction** — `day: 0` · 4 paso(s) · 2 callout(s): note/warn
    - `mostNebEnzymesT` = 37.0 °C  ·  TODO: NEB enzymes ⟨37°C⟩ for min
    - `nebEnzymesMin` = 60.0 min  ·  TODO: enzymes for ⟨60 min⟩ Time Saver
    - `enzymesMarkedTsMin` = 15.0 min  ·  TODO: marked TS ⟨15 min⟩ is sufficient
    - `heatInactivateT` = 65.0 °C  ·  TODO: inactivate at ⟨65°C⟩ min most
    - `hfEnzymesT` = 80.0 °C  ·  TODO: enzymes or ⟨80°C⟩ min check
    - `heatInactivateMin` = 20.0 min  ·  TODO: inactivate at ⟨20 min⟩ most HF
    - `hfEnzymesMin` = 20.0 min  ·  TODO: enzymes or ⟨20 min⟩ check the
- **3 — Gel verification and purification** — `day: 0` · 3 paso(s)
    - `entireDigestPct` = 1.0 %  ·  TODO: digest on ⟨1%⟩ TAE agarose
    - `coloniesEluteRange` = 15.0 – 20.0 µL  ·  TODO: Elute in ⟨15–20 µL⟩ Measure by
- **4 — Dephosphorylation of vector (recommended for single digests)** — `day: 0` · 4 paso(s)
    - `purifiedVectorIncubateT` = 37.0 °C  ·  TODO: vector incubate ⟨37°C⟩ min
    - `purifiedVectorIncubateMin` = 10.0 min  ·  TODO: vector incubate ⟨10 min⟩
    - `valVol` = 1.0 µL  ·  TODO: Add ⟨1 µL⟩ Quick CIP
    - `heatInactivateT2` = 80.0 °C  ·  TODO: Heat inactivate ⟨80°C⟩ min Quick
    - `quickCipT` = 65.0 °C  ·  TODO: CIP or ⟨65°C⟩ min rSAP
    - `heatInactivateMin2` = 2.0 min  ·  TODO: Heat inactivate ⟨2 min⟩ Quick CIP
    - `quickCipMin` = 5.0 min  ·  TODO: CIP or ⟨5 min⟩ rSAP
- **5 — Ligation** — `day: 0` · 5 paso(s) · 2 callout(s): note/warn
    - `iceWaterX` = 10.0 ×  ·  TODO: ice water ⟨10×⟩ Ligase Buffer
    - `overnightColdRoomT` = 16.0 °C  ·  TODO: ⟨16°C⟩ overnight cold
    - `overnightColdRoomMin` = 16.0 h  ·  TODO: ⟨16 h⟩ overnight cold
    - `convenientRoutineRange` = 5.0 – 15.0 min  ·  TODO: ⟨5–15 min⟩ Convenient for
    - `conveniT` = 25.0 °C  ·  TODO: ⟨25°C⟩ Conveni
    - `heatInactivateT3` = 65.0 °C  ·  TODO: inactivate at ⟨65°C⟩ min then
    - `heatInactivateMin3` = 10.0 min  ·  TODO: inactivate at ⟨10 min⟩ then chill
    - `transformRange` = 2.0 – 5.0 µL  ·  TODO: Transform ⟨2–5 µL⟩ into competent

## Transformation of Competent Cells  (`transfo`)

- **Preparation** — `day: 0` · 2 paso(s)
    - `iceDhRange` = 20.0 – 30.0 min  ·  TODO: ice DH ⟨20–30 min⟩
    - `nebStableRange` = 5.0 – 10.0 min  ·  TODO: NEB Stable ⟨5–10 min⟩
    - `appropriateAntibioticT` = 37.0 °C  ·  TODO: antibiotic at ⟨37°C⟩
- **Transformation** — `day: 0` · 5 paso(s)
    - `mixRange` = 1.0 – 5.0 µL  ·  TODO: Mix ⟨1–5 µL⟩ plasmid DNA
    - `pgNgRange` = 25.0 – 50.0 µL  ·  TODO: ng with ⟨25–50 µL⟩ competent cells
    - `plasmidDnaPgAmt` = 100.0 ng  ·  TODO: DNA pg ⟨100 ng⟩ with competent
    - `incubateIceMin` = 2.0 min  ·  TODO: on ice ⟨2 min⟩
    - `heatShockT` = 42.0 °C  ·  TODO: Heat shock ⟨42°C⟩ typically for
    - `heatShockMin` = 60.0 s  ·  TODO: Heat shock ⟨60 s⟩ typically for
    - `heatShockTypicallyMin` = 45.0 s  ·  TODO: shock typically ⟨45 s⟩ for NEB
    - `heatShockTypicallyMin2` = 30.0 s  ·  TODO: shock typically ⟨30 s⟩ for NEB
    - `backIceMin` = 2.0 min  ·  TODO: on ice ⟨2 min⟩
    - `lbSocIncubateT` = 37.0 °C  ·  TODO: SOC incubate ⟨37°C⟩ at rpm
    - `lbSocIncubateMin` = 1.0 h  ·  TODO: SOC incubate ⟨1 h⟩ at rpm
    - `valVol` = 450.0 µL  ·  TODO: Add ⟨450 µL⟩ LB SOC
    - `cubateN` = 250.0 rpm  ·  TODO: cubate at ⟨250 rpm⟩
    - `lentiviralPlasmidsT` = 30.0 °C  ·  TODO: ⟨30°C⟩ for lentiviral
- **Plating** — `day: 0` · 2 paso(s)
    - `valVol2` = 50.0 µL  ·  TODO: ⟨50 µL⟩
    - `incubateOvernightT` = 37.0 °C  ·  TODO: Incubate overnight ⟨37°C⟩
    - `lentiviralT` = 30.0 °C  ·  TODO: ⟨30°C⟩ for lentiviral
- **Colony selection** — `day: 0` · 1 paso(s)
    - `tubeIncubateOvernightT` = 37.0 °C  ·  TODO: incubate overnight ⟨37°C⟩ rpm
    - `singleColoniesVol` = 5.0 mL  ·  TODO: colonies into ⟨5 mL⟩ LB antibiotic
    - `mlLbAntibioticVol` = 15.0 mL  ·  TODO: LB antibiotic ⟨15 mL⟩ tube incubate
    - `tubeIncubateOvernightN` = 200.0 rpm  ·  TODO: incubate overnight ⟨200 rpm⟩

## Miniprep — GeneJET  (`miniprep`)

- **1 — Harvest &amp; lyse** — `day: 0` · 4 paso(s)
    - `cultureRpmMin` = 2.0 min  ·  TODO: at rpm ⟨2 min⟩ discard supernatant
    - `centrifugeVol` = 5.0 mL  ·  TODO: Centrifuge ⟨5 mL⟩ culture at
    - `centrifugeCultureN` = 8000.0 rpm  ·  TODO: culture at ⟨8000 rpm⟩ disca
    - `valVol` = 250.0 µL  ·  TODO: Add ⟨250 µL⟩
    - `valVol2` = 250.0 µL  ·  TODO: Add ⟨250 µL⟩
    - `invertGentlyX` = 6.0 ×  ·  TODO: invert gently ⟨6×⟩ until clear
    - `valVol3` = 350.0 µL  ·  TODO: Add ⟨350 µL⟩
    - `invertCentrifugeMin` = 5.0 min  ·  TODO: invert centrifuge ⟨5 min⟩ to pellet
    - `invertX` = 6.0 ×  ·  TODO: invert ⟨6×⟩ centrifuge
- **2 — Bind, wash &amp; elute** — `day: 0` · 4 paso(s) · 1 callout(s): warn
    - `collectionTubeCentrifuMin` = 1.0 min  ·  TODO: tube centrifuge ⟨1 min⟩ discard flow
    - `valVol4` = 500.0 µL  ·  TODO: Add ⟨500 µL⟩
    - `centrifugeMin` = 60.0 s  ·  TODO: centrifuge ⟨60 s⟩ discard flow
    - `centrifugeEmptyColumnMin` = 1.0 min  ·  TODO: empty column ⟨1 min⟩ to dry
    - `columnCleanVol` = 1.5 mL  ·  TODO: to clean ⟨1.5 mL⟩ tube add
    - `mlTubeVol` = 50.0 µL  ·  TODO: tube add ⟨50 µL⟩
    - `preWarmedT` = 65.0 °C  ·  TODO: warmed to ⟨65°C⟩ for higher
    - `higherYieldIncubateMin` = 2.0 min  ·  TODO: yield incubate ⟨2 min⟩ at RT
    - `rtCentrifugeMin` = 2.0 min  ·  TODO: RT centrifuge ⟨2 min⟩

## NucleoSpin Gel & PCR Clean-up  (`nucleospin`)

- **PCR cleanup mode** — `day: 0` · 5 paso(s)
    - `reactionNtiNtiVol` = 100.0 µL  ·  TODO: ⟨100 µL⟩ reaction NTI
    - `reactionVol` = 200.0 µL  ·  TODO: reaction ⟨200 µL⟩ NTI NTI
    - `collectionTubeSpinMin` = 30.0 s  ·  TODO: tube spin ⟨30 s⟩ discard flow
    - `loadUpVol` = 700.0 µL  ·  TODO: up to ⟨700 µL⟩ of the
    - `washNtSpinMin` = 30.0 s  ·  TODO: NT spin ⟨30 s⟩ discard Repeat
    - `washVol` = 700.0 µL  ·  TODO: Wash ⟨700 µL⟩ NT spin
    - `drySpinMin` = 1.0 min  ·  TODO: Dry spin ⟨1 min⟩ empty column
    - `eluteRange` = 15.0 – 20.0 µL  ·  TODO: Elute add ⟨15–20 µL⟩ NE buffer
    - `neBufferWaitMin` = 1.0 min  ·  TODO: buffer wait ⟨1 min⟩ RT transfer
    - `freshTubeSpinMin` = 1.0 min  ·  TODO: tube spin ⟨1 min⟩
- **Gel extraction mode** — `day: 0` · 5 paso(s) · 1 callout(s): warn
    - `ntiBufferVol` = 200.0 µL  ·  TODO: ⟨200 µL⟩ NTI buffer
    - `ntiBufferAmt` = 100.0 mg  ·  TODO: buffer per ⟨100 mg⟩ gel
    - `incubateUntilDissolvedRange` = 5.0 – 10.0 min  ·  TODO: until dissolved ⟨5–10 min⟩ vortex occasionally
    - `incubateT` = 50.0 °C  ·  TODO: incubate ⟨50°C⟩ until dissolved
    - `columnSpinMin` = 30.0 s  ·  TODO: column spin ⟨30 s⟩ discard flow
    - `washNtSpinMin2` = 30.0 s  ·  TODO: NT spin ⟨30 s⟩ discard Repeat
    - `onceDrySpinMin` = 1.0 min  ·  TODO: Dry spin ⟨1 min⟩
    - `washVol2` = 700.0 µL  ·  TODO: Wash ⟨700 µL⟩ NT spin
    - `eluteRange2` = 15.0 – 20.0 µL  ·  TODO: Elute add ⟨15–20 µL⟩ NE buffer
    - `preWarmT` = 70.0 °C  ·  TODO: warm to ⟨70°C⟩ for large
    - `rtWaitMin` = 1.0 min  ·  TODO: RT wait ⟨1 min⟩ spin min
    - `waitMinSpinMin` = 1.0 min  ·  TODO: min spin ⟨1 min⟩

## gRNA & Donor Design  (`grna`)

- **1 — Retrieve gene sequence (NCBI)** — `day: 0` · 5 paso(s)
- **2 — Select region of interest** — `day: 0` · 3 paso(s)
    - `selectN` = 200.0 bp  ·  TODO: Select ⟨200 bp⟩ region centred
- **3 — Design gRNA candidates (IDT)** — `day: 0` · 4 paso(s) · 2 callout(s): warn/tip
    - `pasteYourN` = 200.0 bp  ·  TODO: paste your ⟨200 bp⟩ region
- **4 — (Knock-in) design the donor template (ssODN)** — `day: 0` · 5 paso(s)
    - `protospacerN` = 12.0 bp  ·  TODO: protospacer the ⟨12 bp⟩ proximal to
    - `keepDonorN` = 200.0 bp  ·  TODO: the donor ⟨200 bp⟩ total Place
    - `typicalDesignRange` = 50.0 – 80.0 bp  ·  TODO: Typical design ⟨50–80 bp⟩ homology arm
    - `armTagMutationRange` = 50.0 – 80.0 bp  ·  TODO: tag mutation ⟨50–80 bp⟩ homology arm
    - `ultramerGtN` = 60.0 nt  ·  TODO: if gt ⟨60 nt⟩ standard PAGE
- **5 — Pre-plan controls and record-keeping** — `day: 0` · 3 paso(s) · 1 callout(s): tip
    - `editSiteAmpliconRange` = 200.0 – 300.0 bp  ·  TODO: site amplicon ⟨200–300 bp⟩

## CRISPR Knockout  (`crispr-ko`)

> Variantes de método: `px458` PX458 Plasmid (Lipofectamine/FuGENE), `rnp` RNP Electroporation

### Part 1 — Clone the gRNA into PX458
- **ssOligo design &amp; order (IDT)** — `day: 0` · 5 paso(s) · variante `px458` · 2 callout(s): note/warn
    - `grnaSpacerN` = 20.0 bp  ·  TODO: ⟨20 bp⟩ gRNA spacer
    - `asympN` = 70.0 nt  ·  TODO: asymp ⟨70 nt⟩ total homology
    - `totalHomologyArmN` = 25.0 bp  ·  TODO: homology arm ⟨25 bp⟩ matches PX
    - `cutSiteMiddotN` = 20.0 bp  ·  TODO: site middot ⟨20 bp⟩ gRNA spacer
    - `middotHomologyArmN` = 25.0 bp  ·  TODO: homology arm ⟨25 bp⟩ matches PX
    - `scaleAmt` = 100.0 nmol  ·  TODO: ⟨100 nmol⟩ scale
    - `teBufferConc` = 50.0 mM  ·  TODO: TE buffer ⟨50 mM⟩ NaCl to
    - `valConc` = 100.0 µM  ·  TODO: ⟨100 µM⟩
    - `freezeT` = -20.0 °C  ·  TODO: freeze at ⟨−20°C⟩
    - `workingStockConc` = 1.0 µM  ·  TODO: ⟨1 µM⟩ working stock
    - `diluteVol` = 1.0 µL  ·  TODO: dilute ⟨1 µL⟩ of stock
    - `stockVol` = 99.0 µL  ·  TODO: stock into ⟨99 µL⟩ buffer
    - `diluteConc` = 100.0 µM  ·  TODO: dilute of ⟨100 µM⟩ stock into
- **Plasmid linearisation (BbsI digest)** — `day: 0` · 3 paso(s) · variante `px458`
    - `pxAmt` = 1.0 µg  ·  TODO: ⟨1 µg⟩ PX
    - `nebT` = 37.0 °C  ·  TODO: NEB at ⟨37°C⟩ for min
    - `nebMin` = 30.0 min  ·  TODO: at for ⟨30 min⟩ following the
    - `agaroseGelPct` = 1.0 %  ·  TODO: ⟨1%⟩ agarose gel
- **HiFi assembly &amp; transformation** — `day: 0` · 4 paso(s) · variante `px458` · 1 callout(s): note
    - `minT` = 50.0 °C  ·  TODO: ⟨50°C⟩ for min
    - `valMin` = 60.0 min  ·  TODO: for ⟨60 min⟩
    - `setT` = 55.0 °C  ·  TODO: set to ⟨55°C⟩
    - `valVol` = 2.0 µL  ·  TODO: ⟨2 µL⟩
    - `protocolHeatShockT` = 42.0 °C  ·  TODO: heat shock ⟨42°C⟩
    - `valMin2` = 30.0 s  ·  TODO: ⟨30 s⟩
    - `lbAmpicillinConc` = 100.0 µg/mL  ·  TODO: LB ampicillin ⟨100 µg/mL⟩ pick colonies
### Part 2 — Transfect &amp; enrich
- **Day 0 — Cell seeding** — `day: 0` · 2 paso(s) · variante `px458`
    - `wildTypeCellsX` = 1.0 ×  ·  TODO: ⟨1 ×⟩ wild type
- **Day 1 — Transfection (FugeneHD, 6-well plate)** — `day: 0` · 4 paso(s) · variante `px458`
    - `pxGrnaPlasmidAmt` = 1.0 µg  ·  TODO: ⟨1 µg⟩ PX gRNA
    - `optiMemVol` = 100.0 µL  ·  TODO: ⟨100 µL⟩ Opti MEM
    - `fugenehdVol` = 3.0 µL  ·  TODO: ⟨3 µL⟩ FugeneHD
    - `optiMemVol2` = 100.0 µL  ·  TODO: ⟨100 µL⟩ Opti MEM
    - `rtMin` = 5.0 min  ·  TODO: ⟨5 min⟩ at RT
- **Day 2–3 — FACS sorting** — `day: 0` · 2 paso(s) · variante `px458` · 1 callout(s): warn
    - `valRange` = 24.0 – 48.0 h  ·  TODO: ⟨24–48 h⟩
- **(sin título)** — `day: 0` · 0 paso(s) · variante `rnp` · 1 callout(s): note
- **Reconstitution — TracrRNA &amp; crRNA** — `day: 0` · 3 paso(s) · variante `rnp`
    - `tracrrnaNmolVol` = 200.0 µL  ·  TODO: tracrRNA nmol ⟨200 µL⟩ Nuclease Free
    - `tracrrnaAmt` = 20.0 nmol  ·  TODO: tracrRNA ⟨20 nmol⟩ Nuclease Free
    - `stockConc` = 100.0 µM  ·  TODO: ⟨100 µM⟩ stock
    - `crrnaNmolVol` = 20.0 µL  ·  TODO: crRNA nmol ⟨20 µL⟩ duplex buffer
    - `crrnaAmt` = 2.0 nmol  ·  TODO: crRNA ⟨2 nmol⟩ duplex buffer
    - `stockConc2` = 100.0 µM  ·  TODO: ⟨100 µM⟩ stock
- **Reconstitution — Cas9** — `day: 0` · 2 paso(s) · variante `rnp`
    - `valVol2` = 50.0 µL  ·  TODO: Add ⟨50 µL⟩ reconstitution solution
    - `casAmt` = 1.0 µg  ·  TODO: Cas ⟨1 µg⟩
    - `spinDownIncubateMin` = 10.0 min  ·  TODO: down incubate ⟨10 min⟩ on ice
- **Anneal TracrRNA + crRNA** — `day: 0` · 2 paso(s) · variante `rnp`
    - `valVol3` = 5.0 µL  ·  TODO: Add ⟨5 µL⟩ of each
    - `incubateT` = 95.0 °C  ·  TODO: Incubate at ⟨95°C⟩ min then
    - `incubateMin` = 5.0 min  ·  TODO: Incubate at ⟨5 min⟩ then spin
- **RNP complex formation (per 2 electroporations, ~0.4M cells)** — `day: 0` · 1 paso(s) · variante `rnp` · 1 callout(s): note
    - `componentsIncubateMin` = 20.0 min  ·  TODO: and incubate ⟨20 min⟩ at RT
- **Cell preparation** — `day: 0` · 4 paso(s) · variante `rnp`
    - `pbsResuspendVol` = 1.0 mL  ·  TODO: resuspend in ⟨1 mL⟩ PBS
    - `countX` = 2.0 ×  ·  TODO: Count add ⟨2×⟩ cells electroporation
    - `valVol4` = 2.0 mL  ·  TODO: Add ⟨2 mL⟩ media to
- **Electroporation** — `day: 0` · 5 paso(s) · variante `rnp`
    - `fillVol` = 50.0 mL  ·  TODO: Fill ⟨50 mL⟩ falcon with
    - `valVol5` = 3.0 mL  ·  TODO: Add ⟨3 mL⟩ electrolyte solution
    - `takeVol` = 10.0 µL  ·  TODO: Take ⟨10 µL⟩ of mix
    - `leaveCellsRange` = 48.0 – 72.0 h  ·  TODO: Leave cells ⟨48–72 h⟩ before analysis
- **After electroporation — pool validation (before single-cell sorting)** — `day: 0` · 3 paso(s) · variante `rnp` · 2 callout(s): note/tip
    - `pooledPopulationRange` = 48.0 – 72.0 h  ·  TODO: population for ⟨48–72 h⟩ minimum before
    - `aimGtPct` = 70.0 %  ·  TODO: for gt ⟨70%⟩ frameshift indels
    - `beforeSortingGtPct` = 70.0 %  ·  TODO: sorting gt ⟨70%⟩ indels by
- **(sin título)** — `day: 0` · 0 paso(s) · 1 callout(s): tip

## CRISPR Knock-in  (`crispr-ki`)

> Variantes de método: `px458` PX458 + Plasmid Donor, `rnp` RNP Electroporation + ssODN

- **1 — Clone gRNA into PX458** — `day: 0` · 0 paso(s) · variante `px458`
- **Design &amp; order ssOligo insert** — `day: 0` · 3 paso(s) · variante `px458` · 1 callout(s): note
    - `grnaSpacerN` = 20.0 bp  ·  TODO: ⟨20 bp⟩ gRNA spacer
    - `homologyArmN` = 25.0 bp  ·  TODO: homology arm ⟨25 bp⟩
    - `grnaSpacerN2` = 20.0 bp  ·  TODO: gRNA spacer ⟨20 bp⟩
    - `homologyArmN2` = 25.0 bp  ·  TODO: homology arm ⟨25 bp⟩
    - `workingStockConc` = 1.0 µM  ·  TODO: ⟨1 µM⟩ working stock
- **Plasmid linearisation (BbsI digest)** — `day: 0` · 3 paso(s) · variante `px458`
    - `pxAmt` = 1.0 µg  ·  TODO: ⟨1 µg⟩ PX
    - `nebT` = 37.0 °C  ·  TODO: NEB at ⟨37°C⟩ for min
    - `nebMin` = 30.0 min  ·  TODO: at for ⟨30 min⟩ following the
    - `agaroseGelPct` = 1.0 %  ·  TODO: ⟨1%⟩ agarose gel
- **HiFi assembly &amp; transformation** — `day: 0` · 4 paso(s) · variante `px458` · 1 callout(s): note
    - `minT` = 50.0 °C  ·  TODO: ⟨50°C⟩ for min
    - `valMin` = 60.0 min  ·  TODO: for ⟨60 min⟩
    - `lidOffT` = 55.0 °C  ·  TODO: off or ⟨55°C⟩
    - `transformVol` = 2.0 µL  ·  TODO: Transform ⟨2 µL⟩ into NEB
    - `ampicillinMlOvernightT` = 37.0 °C  ·  TODO: mL overnight ⟨37°C⟩
    - `lbAmpicillinConc` = 100.0 µg/mL  ·  TODO: LB ampicillin ⟨100 µg/mL⟩ overnight
- **2 — Plasmid donor design** — `day: 0` · 5 paso(s) · variante `px458`
    - `leftHaRange` = 400.0 – 800.0 bp  ·  TODO: Left HA ⟨400–800 bp⟩ Insert Right
    - `insertRightHaRange` = 400.0 – 800.0 bp  ·  TODO: Right HA ⟨400–800 bp⟩
    - `silentDiagnosticSnpRange` = 10.0 – 15.0 bp  ·  TODO: diagnostic SNP ⟨10–15 bp⟩ from the
- **3 — Transfection (Lipofectamine 3000)** — `day: 0` · 4 paso(s) · variante `px458`
    - `seedCellsPct` = 70.0 %  ·  TODO: cells at ⟨70%⟩ confluency the
    - `pxPlasmidDonorRange` = 3.0 – 4.0 µg  ·  TODO: plasmid donor ⟨3–4 µg⟩
    - `pxAmt2` = 1.5 µg  ·  TODO: PX ⟨1.5 µg⟩ plasmid donor
    - `wellRatioRatio` = 2.0   ·  TODO: well ratio ⟨1:2⟩ Cas donor
    - `incubateRange` = 24.0 – 48.0 h  ·  TODO: Incubate ⟨24–48 h⟩ Check GFP
    - `fluorescenceMicroscopyPct` = 60.0 %  ·  TODO: microscopy expect ⟨60%⟩ GFP in
    - `duringFirstMin` = 48.0 h  ·  TODO: the first ⟨48 h⟩ post transfection
- **4 — FACS sorting &amp; clonal expansion** — `day: 0` · 3 paso(s) · variante `px458`
    - `postTransfectionTrypsiMin` = 48.0 h  ·  TODO: ⟨48 h⟩ post transfection
    - `bufferPbsFbsConc` = 10.0 mM  ·  TODO: PBS FBS ⟨10 mM⟩ HEPES filter
    - `sortingBufferPbsPct` = 2.0 %  ·  TODO: buffer PBS ⟨2%⟩ FBS HEPES
    - `excitationGateTopPct` = 20.0 %  ·  TODO: Gate top ⟨20%⟩ GFP for
- **5 — Clone screening** — `day: 0` · 4 paso(s) · variante `px458`
- **(sin título)** — `day: 0` · 0 paso(s) · variante `rnp` · 1 callout(s): note
- **1 — ssODN design** — `day: 0` · 4 paso(s) · variante `rnp`
    - `valRange` = 100.0 – 200.0 nt  ·  TODO: ⟨100–200 nt⟩
    - `valRange2` = 40.0 – 80.0 nt  ·  TODO: ⟨40–80 nt⟩ each
    - `silentDiagnosticSnpN` = 10.0 bp  ·  TODO: diagnostic SNP ⟨10 bp⟩ from the
    - `tePhConc` = 100.0 µM  ·  TODO: pH at ⟨100 µM⟩
    - `synthesisSufficientN` = 120.0 nt  ·  TODO: sufficient for ⟨120 nt⟩ PAGE purify
    - `purifyGtN` = 120.0 nt  ·  TODO: if gt ⟨120 nt⟩ Resuspend in
- **2 — RNP assembly (IDT Alt-R system)** — `day: 0` · 4 paso(s) · variante `rnp`
    - `tracrrnaConc` = 200.0 µM  ·  TODO: tracrRNA to ⟨200 µM⟩ in nuclease
    - `tracrrnaAnnealT` = 95.0 °C  ·  TODO: anneal at ⟨95°C⟩ for min
    - `annealMin` = 5.0 min  ·  TODO: at for ⟨5 min⟩ then cool
    - `finalGrnaDuplexConc` = 100.0 µM  ·  TODO: gRNA duplex ⟨100 µM⟩
    - `proteinVolumeVol` = 1.0 µL  ·  TODO: by volume ⟨1 µL⟩ Cas gRNA
    - `volumeCasVol` = 1.0 µL  ·  TODO: volume Cas ⟨1 µL⟩ gRNA used
    - `proteinVolumeConc` = 61.0 µM  ·  TODO: by volume ⟨61 µM⟩ Cas gRNA
    - `casConc` = 100.0 µM  ·  TODO: Cas ⟨100 µM⟩ gRNA used
    - `duplexCasProteinRatio` = 1.0   ·  TODO: Cas protein ⟨1:1⟩ by volume
    - `incubateRange2` = 10.0 – 15.0 min  ·  TODO: Incubate ⟨10–15 min⟩ at RT
- **3 — Electroporation** — `day: 0` · 6 paso(s) · variante `rnp`
    - `logPhasePct` = 80.0 %  ·  TODO: log phase ⟨80%⟩ confluency Viability
    - `mustGtPct` = 90.0 %  ·  TODO: be gt ⟨90%⟩ before electroporation
    - `cellsMin` = 5.0 min  ·  TODO: at for ⟨5 min⟩ Wash once
    - `pelletX` = 5.0 ×  ·  TODO: Pellet ⟨5 ×⟩ cells at
    - `bufferVol` = 10.0 µL  ·  TODO: Buffer ⟨10 µL⟩ tip or
    - `seBufferVol` = 20.0 µL  ·  TODO: SE buffer ⟨20 µL⟩ per cell
    - `valRange3` = 1.0 – 2.0 µL  ·  TODO: ⟨1–2 µL⟩
    - `casSsodnAmt` = 200.0 pmol  ·  TODO: ⟨200 pmol⟩ Cas ssODN
    - `valRange4` = 1.0 – 2.0 µL  ·  TODO: ⟨1–2 µL⟩
    - `cellAmt` = 200.0 pmol  ·  TODO: ⟨200 pmol⟩ to the
    - `notDisturbMin` = 10.0 min  ·  TODO: disturb for ⟨10 min⟩
- **4 — Recovery &amp; clonal expansion** — `day: 0` · 3 paso(s) · variante `rnp`
    - `postElectroporationCheMin` = 24.0 h  ·  TODO: ⟨24 h⟩ post electroporation
    - `refreshMediumExpectPct` = 80.0 %  ·  TODO: medium Expect ⟨80%⟩ viability
    - `harvestSmallAliquotRange` = 48.0 – 72.0 h  ·  TODO: ⟨48–72 h⟩ harvest small
    - `rnpActivityExpectPct` = 60.0 %  ·  TODO: activity expect ⟨60%⟩ indels as
- **5 — Genotyping HDR clones** — `day: 0` · 4 paso(s) · variante `rnp`
    - `templateExpectedAmplicRange` = 300.0 – 600.0 bp  ·  TODO: Expected amplicon ⟨300–600 bp⟩
    - `differenceInsertN` = 20.0 bp  ·  TODO: if insert ⟨20 bp⟩ Sequence all
- **(sin título)** — `day: 0` · 0 paso(s) · 1 callout(s): tip

## Single Cell Sorting (FACS)  (`scs`)

- **Make conditioned media** — `day: 0` · 4 paso(s)
    - `growFlasksPct` = 70.0 %  ·  TODO: flasks to ⟨70%⟩ confluency in
    - `aliquotsT` = 4.0 °C  ·  TODO: aliquots at ⟨4°C⟩ few weeks
    - `fewWeeksT` = -20.0 °C  ·  TODO: weeks or ⟨−20°C⟩ long term
    - `useSpinRpmMin` = 5.0 min  ·  TODO: spin rpm ⟨5 min⟩ discard pellet
    - `beforeUseSpinN` = 4000.0 rpm  ·  TODO: use spin ⟨4000 rpm⟩ discard pellet
    - `dilutePct` = 20.0 %  ·  TODO: Dilute with ⟨20%⟩ FBS media
    - `diluteRatio` = 1.0   ·  TODO: Dilute ⟨1:1⟩ with FBS
- **24 h before sorting — prepare 96-well plates** — `day: 0` · 1 paso(s) · 1 callout(s): note
    - `wellLeaveT` = 37.0 °C  ·  TODO: leave at ⟨37°C⟩ CO
    - `aliquotVol` = 150.0 µL  ·  TODO: Aliquot ⟨150 µL⟩ well leave
    - `wellLeavePct` = 5.0 %  ·  TODO: leave at ⟨5%⟩ CO
- **1–2 h before sorting** — `day: 0` · 1 paso(s)
    - `facsMediaVol` = 10.0 mL  ·  TODO: FACS media ⟨10 mL⟩ media FBS
    - `mediaMlMediaVol` = 100.0 µL  ·  TODO: mL media ⟨100 µL⟩ FBS DAPI
    - `mlMediaFbsVol` = 1.0 µL  ·  TODO: media FBS ⟨1 µL⟩ DAPI filter
- **30 min before sorting** — `day: 0` · 1 paso(s)
    - `mediaFbsMaxVol` = 300.0 µL  ·  TODO: FBS max ⟨300 µL⟩ if lt
    - `maxLtConc` = 2.0 M  ·  TODO: if lt ⟨2M⟩ cells
    - `mlMediaPct` = 1.0 %  ·  TODO: in media ⟨1%⟩ FBS max
    - `pelletResuspendX` = 5.0 ×  ·  TODO: resuspend at ⟨5×⟩ mL in
- **At the sorting facility** — `day: 0` · 2 paso(s) · 1 callout(s): note
    - `backIncubatorT` = 37.0 °C  ·  TODO: of incubator ⟨37°C⟩ days
    - `backIncubatorMin` = 20.0 days  ·  TODO: of incubator ⟨20 days⟩
- **Clone expansion** — `day: 0` · 3 paso(s)
    - `afterMin` = 20.0 days  ·  TODO: After ⟨20 days⟩ mark wells
    - `valVol` = 50.0 µL  ·  TODO: Add ⟨50 µL⟩ fresh media

## BCA & Sample Prep  (`bca`)

- **1 — BCA assay** — `day: 0` · 5 paso(s) · 1 callout(s): warn
    - `mlDdhVol` = 25.0 µL  ·  TODO: in ddH ⟨25 µL⟩ well in
    - `prepareBsaStandardsConc` = 0.125 mg/mL  ·  TODO: BSA standards ⟨0.125 mg/mL⟩ in ddH
    - `diluteLysatesVol` = 10.0 µL  ·  TODO: Dilute lysates ⟨10 µL⟩ lysate ddH
    - `diluteLysatesLysateVol` = 50.0 µL  ·  TODO: lysates lysate ⟨50 µL⟩ ddH or
    - `veryConcentratedSampleVol` = 25.0 µL  ·  TODO: concentrated samples ⟨25 µL⟩ well in
    - `diluteLysatesRatio` = 6.0   ·  TODO: Dilute lysates ⟨1:6⟩ lysate di
    - `lysateDdhRatio` = 10.0   ·  TODO: ddH or ⟨1:10⟩ for very
    - `rpmMinIncubateT` = 37.0 °C  ·  TODO: min incubate ⟨37°C⟩ min
    - `mixRpmMin` = 1.0 min  ·  TODO: at rpm ⟨1 min⟩ incubate mi
    - `rpmMinIncubateMin` = 30.0 min  ·  TODO: min incubate ⟨30 min⟩
    - `valVol` = 200.0 µL  ·  TODO: Add ⟨200 µL⟩ BCA reagent
    - `reagentMixN` = 600.0 rpm  ·  TODO: mix at ⟨600 rpm⟩ incubate rpmMinI
- **2 — Sample prep calculator** — `day: 0` · 0 paso(s) · 1 callout(s): note

## Western Blot  (`westernblot`)

- **Cell lysis** — `day: 0` · 7 paso(s)
    - `coolCentrifugeT` = 4.0 °C  ·  TODO: centrifuge at ⟨4°C⟩
    - `iceRipaVol` = 100.0 uL  ·  TODO: ice RIPA ⟨100 uL⟩ well uL
    - `ripaUlWellVol` = 50.0 uL  ·  TODO: uL well ⟨50 uL⟩ well PI
    - `wellWellX` = 1.0 ×  ·  TODO: well well ⟨1×⟩ PI stock
    - `wellWellPiX` = 100.0 ×  ·  TODO: well PI ⟨100×⟩ stock benzonase
    - `piStockBenzonaseX` = 1000.0 ×  ·  TODO: stock benzonase ⟨1000×⟩
    - `distributeCarefullyIncMin` = 10.0 min  ·  TODO: carefully incubate ⟨10 min⟩ in fridge
    - `centrifugeT` = 4.0 °C  ·  TODO: centrifuge ⟨4°C⟩ min transfer
    - `centrifugeMin` = 15.0 min  ·  TODO: centrifuge ⟨15 min⟩ transfer supernatant
    - `freezeT` = -80.0 °C  ·  TODO: freeze at ⟨−80°C⟩
- **BCA protein quantification** — `day: 0` · 5 paso(s)
    - `mlDdhVol` = 25.0 uL  ·  TODO: in ddH ⟨25 uL⟩ per well
    - `bsaStandardsConc` = 0.125 mg/mL  ·  TODO: BSA standards ⟨0.125 mg/mL⟩ in ddH
    - `diluteLysatesVol` = 10.0 uL  ·  TODO: Dilute lysates ⟨10 uL⟩ uL ddH
    - `diluteLysatesUlVol` = 50.0 uL  ·  TODO: lysates uL ⟨50 uL⟩ ddH or
    - `diluteLysatesRatio` = 6.0   ·  TODO: Dilute lysates ⟨1:6⟩ diluteLys
    - `lutelysatesvolDdhRatio` = 10.0   ·  TODO: ddH or ⟨1:10⟩ for concentrated
    - `mixRpmMinT` = 37.0 °C  ·  TODO: rpm min ⟨37°C⟩ min
    - `reagentMixRpmMin` = 1.0 min  ·  TODO: mix rpm ⟨1 min⟩ min
    - `mixRpmMinMin` = 30.0 min  ·  TODO: rpm min ⟨30 min⟩
    - `loadVol` = 25.0 uL  ·  TODO: Load ⟨25 uL⟩ standard sample
    - `duplicateVol` = 200.0 uL  ·  TODO: duplicate add ⟨200 uL⟩ BCA reagent
    - `bcaReagentMixN` = 600.0 rpm  ·  TODO: reagent mix ⟨600 rpm⟩ mixRpmMin
- **SDS-PAGE** — `day: 0` · 3 paso(s)
    - `mopsStockVol` = 1.0 L  ·  TODO: from stock ⟨1 L⟩
    - `runningBufferX` = 1.0 ×  ·  TODO: Running buffer ⟨1×⟩ MOPS from
    - `bufferMopsX` = 20.0 ×  ·  TODO: MOPS from ⟨20×⟩ stock
    - `nupagePct` = 12.0 %  ·  TODO: NuPAGE ⟨12%⟩ bis tris
    - `ladderUlRunMin` = 1.0 h  ·  TODO: uL run ⟨1h⟩ min well
    - `ladderUlRunMin2` = 15.0 min  ·  TODO: uL run ⟨15 min⟩ well gel
    - `loadLadderVol` = 2.5 uL  ·  TODO: Load ladder ⟨2.5 uL⟩ run
- **Transfer &amp; blotting** — `day: 0` · 5 paso(s) · 1 callout(s): note
    - `filterPaperX` = 7.0 ×  ·  TODO: paper to ⟨7×⟩ cm pre
    - `blackRunMin` = 90.0 min  ·  TODO: black run ⟨90 min⟩ in ice
    - `ponceauMin` = 1.0 min  ·  TODO: Ponceau ⟨1 min⟩ rocking rinse
    - `washTbsMin` = 5.0 min  ·  TODO: Wash TBS ⟨5 min⟩ block milk
    - `blockMilkTbsMin` = 1.0 h  ·  TODO: milk TBS ⟨1 h⟩ RT rinse
    - `rtRinseTbsMin` = 5.0 s  ·  TODO: rinse TBS ⟨5 s⟩
    - `washTbsBlockPct` = 5.0 %  ·  TODO: TBS block ⟨5%⟩ milk TBS
    - `tbsOvernightT` = 4.0 °C  ·  TODO: overnight at ⟨4°C⟩ keep antibody
    - `primaryAntibodyPct` = 5.0 %  ·  TODO: antibody in ⟨5%⟩ milk TBS
- **Next day** — `day: 0` · 3 paso(s) · 1 callout(s): tip
    - `washTbsRange` = 5.0 – 10.0 min  ·  TODO: Wash TBS ⟨5–10 min⟩
    - `washX` = 2.0 ×  ·  TODO: Wash ⟨2×⟩ TBS
    - `rhodamineTbsMin` = 1.0 h  ·  TODO: in TBS ⟨1 h⟩ RT on
    - `secondaryMsRbRatio` = 4000.0   ·  TODO: Ms Rb ⟨1:4000⟩ tubulin hFAB
    - `tubulinHfabRhodamineRatio` = 4000.0   ·  TODO: hFAB rhodamine ⟨1:4000⟩ in TBS
    - `washTbsRange2` = 5.0 – 10.0 min  ·  TODO: Wash TBS ⟨5–10 min⟩ image
    - `washX2` = 5.0 ×  ·  TODO: Wash ⟨5×⟩ TBS image

## Immunoprecipitation  (`ip`)

- **Seeding &amp; treatment** — `day: 0` · 3 paso(s)
    - `plateConditionConc` = 1.2 M  ·  TODO: per condition ⟨1.2M⟩ cells plate
    - `cellsStartMin` = 1.0 h  ·  TODO: start with ⟨1 h⟩ compound incubation
- **Lysis** — `day: 0` · 4 paso(s)
    - `pbsRipaVol` = 300.0 µL  ·  TODO: add RIPA ⟨300 µL⟩ well PI
    - `ripaWellX` = 1.0 ×  ·  TODO: RIPA well ⟨1×⟩ PI benzonase
    - `ripaWellPiX` = 100.0 ×  ·  TODO: well PI ⟨100×⟩ benzonase
    - `wellPiBenzonaseX` = 1000.0 ×  ·  TODO: PI benzonase ⟨1000×⟩
    - `incubateMin` = 10.0 min  ·  TODO: Incubate ⟨10 min⟩ in fridge
    - `eppendorfCentrifugeRpmMin` = 15.0 min  ·  TODO: centrifuge rpm ⟨15 min⟩ keep supernatant
    - `eppendorfCentrifugeN` = 0.0 rpm  ·  TODO: Eppendorf centrifuge ⟨000 rpm⟩ keep
    - `quantificationNormalizAmt` = 3.0 mg  ·  TODO: normalize to ⟨3 mg⟩ sample
- **Immunoprecipitation (RBM39 IgG sc-376531 example)** — `day: 0` · 3 paso(s)
    - `sampleSplitInputAmt` = 200.0 µg  ·  TODO: ⟨200 µg⟩ sample split
    - `sampleSplitAmt` = 100.0 µg  ·  TODO: sample split ⟨100 µg⟩ INPUT IP
    - `sampleSplitInputAmt2` = 100.0 µg  ·  TODO: split INPUT ⟨100 µg⟩ IP
    - `rbmIggProteinVol` = 40.0 µL  ·  TODO: IgG protein ⟨40 µL⟩ mg if
    - `mgConc` = 200.0 µg/mL  ·  TODO: if at ⟨200 µg/mL⟩ Tube Ms
    - `tubeRbmIggAmt` = 2.0 µg  ·  TODO: RBM IgG ⟨2 µg⟩ protein
    - `tubeRbmIggAmt2` = 250.0 µg  ·  TODO: RBM IgG ⟨250 µg⟩ protein mg
    - `msIggControlAmt` = 1.0 µg  ·  TODO: IgG control ⟨1 µg⟩ mg lysate
    - `totalIncubateOvernightT` = 4.0 °C  ·  TODO: incubate overnight ⟨4°C⟩ with rotation
    - `ripaVol` = 1.0 mL  ·  TODO: RIPA to ⟨1 mL⟩ total incubate
- **Bead capture** — `day: 0` · 4 paso(s)
    - `washProteinBeadsVol` = 25.0 µL  ·  TODO: Protein beads ⟨25 µL⟩ sample wash
    - `proteinBeadsSampleVol` = 500.0 µL  ·  TODO: beads sample ⟨500 µL⟩ wash buffer
    - `sampleWashBufferConc` = 50.0 mM  ·  TODO: wash buffer ⟨50 mM⟩ Tris mM
    - `bufferMmTrisConc` = 150.0 mM  ·  TODO: mM Tris ⟨150 mM⟩ NaCl magnetic
    - `beadsIncubateT` = 4.0 °C  ·  TODO: beads incubate ⟨4°C⟩ with rotation
    - `beadsIncubateMin` = 1.0 h  ·  TODO: beads incubate ⟨1 h⟩ with rotation
    - `washVol` = 1000.0 µL  ·  TODO: Wash with ⟨1000 µL⟩ wash buffer
    - `washX` = 5.0 ×  ·  TODO: Wash ⟨5×⟩ with wash
- **Elution** — `day: 0` · 2 paso(s) · 1 callout(s): warn
    - `ldsDttBoilT` = 90.0 °C  ·  TODO: DTT boil ⟨90°C⟩ min collect
    - `ldsDttBoilMin` = 10.0 min  ·  TODO: DTT boil ⟨10 min⟩ collect supernatant
    - `valVol` = 80.0 µL  ·  TODO: Add ⟨80 µL⟩ loading buffer
    - `loadingBufferX` = 4.0 ×  ·  TODO: loading buffer ⟨4×⟩ LDS DTT
    - `loadingBufferLdsX` = 10.0 ×  ·  TODO: buffer LDS ⟨10×⟩ DTT boil

## HiBiT Blotting System (Promega)  (`hibit`)

- **(sin título)** — `day: 0` · 6 paso(s) · 1 callout(s): tip
    - `hibitReagentDiluteX` = 10.0 ×  ·  TODO: reagent dilute ⟨10×⟩ Nano Glo
    - `waterLgbitX` = 200.0 ×  ·  TODO: add LgBiT ⟨200×⟩ add Nano
    - `regLuciferaseSubstrateX` = 500.0 ×  ·  TODO: Luciferase Substrate ⟨500×⟩
    - `incubateMembraneMin` = 5.0 min  ·  TODO: Incubate membrane ⟨5 min⟩ with gentle

## HiBiT Lytic Assay  (`hibitlytic`)

- **Protocol** — `day: 0` · 5 paso(s)
    - `requiredTypicallyRange` = 4.0 – 24.0 h  ·  TODO: required typically ⟨4–24 h⟩ for degraders
    - `plateShakerRpmMin` = 1.0 min  ·  TODO: shaker rpm ⟨1 min⟩
    - `plateShakerN` = 300.0 rpm  ·  TODO: plate shaker ⟨300 rpm⟩
    - `valMin` = 10.0 min  ·  TODO: ⟨10 min⟩
    - `valMin2` = 0.3 s  ·  TODO: ⟨0.3 s⟩

## CellTiter-Glo® 2.0 — Cell Viability  (`ctg2`)

- **Reagent preparation** — `day: 0` · 3 paso(s)
    - `overnightT` = 4.0 °C  ·  TODO: ⟨4°C⟩ overnight
    - `valT` = 22.0 °C  ·  TODO: or in ⟨22°C⟩ water bath
    - `leaveBenchRange` = 10.0 – 15.0 min  ·  TODO: on bench ⟨10–15 min⟩ before water
    - `doNotExceedT` = 25.0 °C  ·  TODO: not exceed ⟨25°C⟩ if stored
    - `storedT` = -65.0 °C  ·  TODO: stored at ⟨−65°C⟩ leave on
    - `waterBathT` = 22.0 °C  ·  TODO: ⟨22°C⟩ water bath
    - `mlRequiresMin` = 30.0 min  ·  TODO: mL requires ⟨30 min⟩ mL requires
    - `minMlRequiresMin` = 100.0 min  ·  TODO: mL requires ⟨100 min⟩
    - `requiresMlVol` = 100.0 mL  ·  TODO: ⟨100 mL⟩ requires mL
    - `mlRequiresVol` = 500.0 mL  ·  TODO: mL requires ⟨500 mL⟩ requires
- **Cell viability protocol** — `day: 0` · 8 paso(s) · 2 callout(s): warn/tip
    - `valMin` = 30.0 min  ·  TODO: ⟨30 min⟩
    - `wellWellVol` = 100.0 µL  ·  TODO: well well ⟨100 µL⟩ reagent to
    - `wellReagentVol` = 100.0 µL  ·  TODO: reagent to ⟨100 µL⟩ medium well
    - `mediumWellVol` = 25.0 µL  ·  TODO: medium well ⟨25 µL⟩ to
    - `mediumWellVol2` = 25.0 µL  ·  TODO: well to ⟨25 µL⟩
    - `valMin2` = 2.0 min  ·  TODO: ⟨2 min⟩
    - `valMin3` = 10.0 min  ·  TODO: ⟨10 min⟩
    - `wellMin` = 1.0 s  ·  TODO: ⟨1 s⟩ well

## Retro/Lentiviral Transduction  (`lenti`)

- **Virus generation** — `day: 0` · 6 paso(s) · 1 callout(s): warn
    - `cellsMlVol` = 10.0 mL  ·  TODO: mL in ⟨10 mL⟩ into cm
    - `hekFtX` = 1.5 ×  ·  TODO: FT at ⟨1.5×⟩ cells mL
    - `nextDayPct` = 60.0 %  ·  TODO: Next day ⟨60%⟩ confluency prepare
    - `tubeVol` = 300.0 µL  ·  TODO: Tube ⟨300 µL⟩ OptiMEM vector
    - `tubeOptimemAmt` = 6.0 µg  ·  TODO: Tube OptiMEM ⟨6 µg⟩ vector plasmid
    - `lentiviralTransferPlasAmt` = 3.8 µg  ·  TODO: transfer plasmid ⟨3.8 µg⟩ Gag Pol
    - `lentiviralAmt` = 2.0 µg  ·  TODO: for lentiviral ⟨2 µg⟩
    - `tubeVol2` = 300.0 µL  ·  TODO: Tube ⟨300 µL⟩ OptiMEM PEI
    - `tubeOptimemVol` = 24.0 µL  ·  TODO: Tube OptiMEM ⟨24 µL⟩ PEI
    - `incubateMin` = 5.0 min  ·  TODO: Incubate ⟨5 min⟩ in hood
    - `mixGentlyIncubateMin` = 20.0 min  ·  TODO: gently incubate ⟨20 min⟩
    - `valVol` = 9.0 mL  ·  TODO: Add to ⟨9 mL⟩ pre warmed
    - `freshMlIncubateMin` = 24.0 h  ·  TODO: mL incubate ⟨24 h⟩
    - `replaceFreshVol` = 10.0 mL  ·  TODO: with fresh ⟨10 mL⟩ incubate
- **Harvest (24 h after media change)** — `day: 0` · 1 paso(s) · 1 callout(s): note
    - `storeT` = -80.0 °C  ·  TODO: store at ⟨−80°C⟩
    - `removeMediaCentrifugeMin` = 5.0 min  ·  TODO: media centrifuge ⟨5 min⟩ filter through
- **Viral infection** — `day: 0` · 5 paso(s)
    - `overnightCellsWellVol` = 2.0 mL  ·  TODO: cells well ⟨2 mL⟩ media
    - `wellPlateOvernightConc` = 0.5 M  ·  TODO: plate overnight ⟨0.5M⟩ cells well
    - `onlyVirusMediaRatio` = 1.0   ·  TODO: virus media ⟨1:1⟩ media only
    - `wellIncubateMin` = 24.0 h  ·  TODO: well incubate ⟨24 h⟩
    - `polybreneMlVol` = 1.6 µL  ·  TODO: to mL ⟨1.6 µL⟩ mL add
    - `polybreneMlVol2` = 2.0 mL  ·  TODO: to mL ⟨2 mL⟩ add to
    - `polybreneConc` = 8.0 µg/mL  ·  TODO: Polybrene to ⟨8 µg/mL⟩ polybreneMlVo
    - `selectionAntibioticRange` = 48.0 – 72.0 h  ·  TODO: antibiotic at ⟨48–72 h⟩ post transduction

## Transfection — Forward  (`transfection`)

- **Day 0 — Seeding** — `day: 0` · 2 paso(s)
    - `soTheyReachPct` = 80.0 %  ·  TODO: they reach ⟨80%⟩ confluence at
    - `overnightNbspPct` = 5.0 %  ·  TODO: at nbsp ⟨5%⟩ CO
- **Day 1 — Transfection** — `day: 0` · 5 paso(s)
    - `incubateRange` = 10.0 – 15.0 min  ·  TODO: Incubate ⟨10–15 min⟩ at RT
    - `formComplexesRange` = 5.0 – 20.0 min  ·  TODO: form complexes ⟨5–20 min⟩ depending on
    - `incubateNbspNbspPct` = 5.0 %  ·  TODO: nbsp nbsp ⟨5%⟩ CO to

## Transfection — Reverse  (`revtx`)

- **Transfection conditions (per 12-well)** — `day: 0` · 4 paso(s)
    - `plasmidDnaAmt` = 800.0 ng  ·  TODO: Plasmid DNA ⟨800 ng⟩
    - `fugeneHdVol` = 2.4 µL  ·  TODO: FuGENE HD ⟨2.4 µL⟩
    - `optiMemVol` = 100.0 µL  ·  TODO: Opti MEM ⟨100 µL⟩
    - `cellSuspensionVol` = 1.0 mL  ·  TODO: Cell suspension ⟨1 mL⟩ containing cells
    - `cellSuspensionContainiX` = 2.0 ×  ·  TODO: suspension containing ⟨2.0×⟩ cells
- **Cell seeding** — `day: 0` · 2 paso(s)
    - `seedX` = 2.0 ×  ·  TODO: Seed ⟨2.0×⟩ cells per
- **Procedure** — `day: 0` · 8 paso(s)
    - `pipetteIncubateRange` = 5.0 – 15.0 min  ·  TODO: and incubate ⟨5–15 min⟩ RT to
    - `wellVol` = 1.0 mL  ·  TODO: well with ⟨1 mL⟩ complete medium
    - `completeMediumContainiX` = 2.0 ×  ·  TODO: medium containing ⟨2.0×⟩ freshly trypsinized
    - `underStandardConditionT` = 37.0 °C  ·  TODO: standard conditions ⟨37°C⟩ CO to
    - `underStandardConditionPct` = 5.0 %  ·  TODO: standard conditions ⟨5%⟩ CO to

## Cell Seeding  (`seeding`)

- **Procedure** — `day: 0` · 4 paso(s)

## S-Trap Sample Preparation  (`strap`)

- **Reduction** — `day: 0` · 2 paso(s)
    - `dttVialMgVol` = 100.0 µL  ·  TODO: vial mg ⟨100 µL⟩ mM stock
    - `dttVialMgConc` = 500.0 mM  ·  TODO: vial mg ⟨500 mM⟩ stock add
    - `volumeConc` = 20.0 mM  ·  TODO: volume for ⟨20 mM⟩ final in
    - `dttVialAmt` = 7.7 mg  ·  TODO: DTT vial ⟨7.7 mg⟩
    - `incubateRange` = 20.0 – 30.0 min  ·  TODO: Incubate ⟨20–30 min⟩
    - `incubateT` = 55.0 °C  ·  TODO: Incubate ⟨55°C⟩
- **Alkylation** — `day: 0` · 2 paso(s)
    - `stockVol` = 132.0 µL  ·  TODO: stock add ⟨132 µL⟩ to alkylator
    - `teabStockConc` = 200.0 mM  ·  TODO: ⟨200 mM⟩ TEAB from
    - `mmTeabConc` = 1.0 M  ·  TODO: TEAB from ⟨1 M⟩ stock add
    - `alkylatorVialConc` = 375.0 mM  ·  TODO: alkylator vial ⟨375 mM⟩ add for
    - `mmConc` = 20.0 mM  ·  TODO: add for ⟨20 mM⟩ final
    - `incubateMin` = 10.0 min  ·  TODO: Incubate ⟨10 min⟩ RT in
- **Acidify** — `day: 0` · 1 paso(s)
    - `phosphoricAcidVol` = 5.0 µL  ·  TODO: phosphoric acid ⟨5 µL⟩ to sample
    - `phosphoricAcidVol2` = 45.0 µL  ·  TODO: acid to ⟨45 µL⟩ sample
    - `valPct` = 12.0 %  ·  TODO: Add of ⟨12%⟩ phosphoric acid
    - `valRatio` = 10.0   ·  TODO: Add ⟨1:10⟩ of phosphoric
- **Trap protein on S-Trap** — `day: 0` · 3 paso(s)
    - `bindingWashBufferVol` = 1.0 mL  ·  TODO: Wash buffer ⟨1 mL⟩ TEAB mL
    - `bufferMlTeabVol` = 9.0 mL  ·  TODO: mL TEAB ⟨9 mL⟩ MeOH mM
    - `washBufferTeabConc` = 1.0 M  ·  TODO: buffer TEAB ⟨1M⟩ MeOH mM
    - `indingwashbuffervolTeaConc` = 100.0 mM  ·  TODO: TEAB MeOH ⟨100 mM⟩ TEAB in
    - `meohTeabPct` = 90.0 %  ·  TODO: TEAB in ⟨90%⟩ MeOH
    - `trapVol` = 1.5 mL  ·  TODO: Trap in ⟨1.5 mL⟩ tube
    - `valX` = 7.0 ×  ·  TODO: Add ⟨7×⟩ sample volume
    - `centrifugeMin` = 30.0 s  ·  TODO: Centrifuge ⟨30 s⟩ if not
- **Wash × 3** — `day: 0` · 2 paso(s)
    - `washBufferCentrifugeMin` = 30.0 s  ·  TODO: buffer centrifuge ⟨30 s⟩ discard flow
    - `valVol` = 150.0 µL  ·  TODO: Add ⟨150 µL⟩ Binding Wash
    - `finalCentrifugeMin` = 1.0 min  ·  TODO: Final centrifuge ⟨1 min⟩ transfer Trap
- **Trypsin digestion** — `day: 0` · 4 paso(s)
    - `mixTrypsinVol` = 1500.0 µL  ·  TODO: trypsin in ⟨1500 µL⟩ mM TEAB
    - `mmTeabVol` = 100.0 µL  ·  TODO: TEAB add ⟨100 µL⟩ to each
    - `mixTrypsinConc` = 100.0 mM  ·  TODO: trypsin in ⟨100 mM⟩ TEAB add
    - `ratioRecommendedAmt` = 100.0 µg  ·  TODO: Ratio recommended ⟨100 µg⟩ protein trypsin
    - `ratioRecommendedProteiAmt` = 6.67 µg  ·  TODO: recommended protein ⟨6.67 µg⟩ trypsin mix
    - `proteinTrypsinMixAmt` = 100.0 µg  ·  TODO: trypsin mix ⟨100 µg⟩ trypsin in
    - `ratioRatio` = 15.0   ·  TODO: Ratio ⟨1:15⟩ recommended ratioRecommendedAmt
    - `incubateT2` = 37.0 °C  ·  TODO: Incubate ⟨37°C⟩ overnight
- **Elution** — `day: 0` · 4 paso(s)
    - `mmTeabMin` = 1.0 min  ·  TODO: mM TEAB ⟨1 min⟩
    - `mmTeabVol2` = 100.0 µL  ·  TODO: ⟨100 µL⟩ mM TEAB
    - `teabConc` = 50.0 mM  ·  TODO: ⟨50 mM⟩ TEAB
    - `formicAcidMin` = 1.0 min  ·  TODO: formic acid ⟨1 min⟩
    - `formicAcidFormVol` = 100.0 µL  ·  TODO: ⟨100 µL⟩ formic acid
    - `formicAcidFormicacidPct` = 0.15 %  ·  TODO: ⟨0.15%⟩ formic acid
    - `acnMin` = 1.0 min  ·  TODO: ACN ⟨1 min⟩
    - `acnVol` = 100.0 µL  ·  TODO: ⟨100 µL⟩ ACN
    - `acnPct` = 50.0 %  ·  TODO: ⟨50%⟩ ACN
    - `labelledTubesTakeAmt` = 30.0 µg  ·  TODO: tubes take ⟨30 µg⟩ sample dry

## DIA-NN — Data-Independent Acquisition  (`diann`)

- **A — Data organisation** — `day: 0` · 3 paso(s)
- **B — FASTA file preparation** — `day: 0` · 3 paso(s)
- **C — DIA-NN processing setup** — `day: 0` · 8 paso(s)
- **D — Key output files** — `day: 0` · 3 paso(s) · 1 callout(s): tip

## Perseus — Statistical Analysis  (`perseus`)

- **A — Import data** — `day: 0` · 5 paso(s)
- **B — Sample annotation** — `day: 0` · 4 paso(s)
- **C — Log&#8322; transformation** — `day: 0` · 2 paso(s)
- **D — Filter contaminants and low-quality IDs** — `day: 0` · 5 paso(s) · 1 callout(s): note
- **E — Filter by valid values** — `day: 0` · 4 paso(s)
- **F — Missing value imputation** — `day: 0` · 3 paso(s)
- **G — Exploratory analysis: PCA (optional but recommended)** — `day: 0` · 3 paso(s)
- **H — Differential analysis: volcano plot** — `day: 0` · 4 paso(s)
- **I — Export results** — `day: 0` · 3 paso(s) · 1 callout(s): tip

## MiSeq — Amplicon Sequencing  (`miseq`)

- **1 — Design primers** — `day: 0` · 6 paso(s)
    - `interestOptimalAmplicoN` = 200.0 bp  ·  TODO: optimal amplicon ⟨200 bp⟩ excl universal
    - `templateSetRangeN` = 300.0 bp  ·  TODO: ⟨300 bp⟩ template set
    - `desaltedReconstituteConc` = 100.0 µM  ·  TODO: reconstitute to ⟨100 µM⟩ stock working
    - `stockWorkingConc` = 10.0 µM  ·  TODO: working at ⟨10 µM⟩
- **2 — Test PCR (GoTAQ G2, optional)** — `day: 0` · 1 paso(s) · 1 callout(s): note
    - `runVol` = 10.0 µL  ·  TODO: Run ⟨10 µL⟩ on TAE
    - `runPct` = 1.0 %  ·  TODO: Run on ⟨1%⟩ TAE agarose
    - `agaroseGelExpectN` = 267.0 bp  ·  TODO: gel expect ⟨267 bp⟩ for bp
    - `expectBpN` = 200.0 bp  ·  TODO: bp for ⟨200 bp⟩ amplicon
- **3 — High-fidelity PCR for MiSeq submission** — `day: 0` · 2 paso(s) · 1 callout(s): note
    - `runVol2` = 10.0 µL  ·  TODO: Run ⟨10 µL⟩ on TAE
    - `runPct2` = 1.0 %  ·  TODO: Run on ⟨1%⟩ TAE agarose
- **4 — Clean up (AMPure XP beads)** — `day: 0` · 4 paso(s)
    - `rtVortexMin` = 10.0 s  ·  TODO: RT vortex ⟨10 s⟩ add bead
    - `incubateRtMin` = 8.0 min  ·  TODO: Incubate RT ⟨8 min⟩ magnetic separator
    - `minMagneticSeparatorMin` = 5.0 min  ·  TODO: magnetic separator ⟨5 min⟩ remove supernatant
    - `freshEtohWashesMin` = 30.0 s  ·  TODO: EtOH washes ⟨30 s⟩ each on
    - `valVol` = 200.0 µL  ·  TODO: Add ⟨200 µL⟩ fresh EtOH
    - `freshPct` = 80.0 %  ·  TODO: Add fresh ⟨80%⟩ EtOH washes
    - `molecularGradeIncubateMin` = 2.0 min  ·  TODO: grade incubate ⟨2 min⟩ RT transfer
    - `cracksAppearVol` = 30.0 µL  ·  TODO: appear add ⟨30 µL⟩ molecular grade
- **5 — Submission** — `day: 0` · 2 paso(s)
    - `submitRange` = 15.0 – 25.0 ng  ·  TODO: Submit at ⟨15–25 ng⟩ label name
    - `submitVol` = 6.0 µL  ·  TODO: Submit ⟨6 µL⟩ at label

## Retrieve & Annotate Gene Sequences  (`geneseq`)

- **1 — Obtain gene sequence (NCBI)** — `day: 0` · 3 paso(s)
- **2 — Import into SnapGene** — `day: 0` · 3 paso(s)
- **3 — Retrieve promoter (EPD)** — `day: 0` · 2 paso(s)
    - `tataBoxN` = 30.0 bp  ·  TODO: TATA box ⟨30 bp⟩ upstream may
- **4 — Transcription factor binding sites** — `day: 0` · 1 paso(s)
- **5 — Final annotation in SnapGene** — `day: 0` · 1 paso(s) · 1 callout(s): tip

## Finding & Evaluating Crystal Structures (PDB)  (`pdb`)

- **1 — Search for your protein** — `day: 0` · 3 paso(s)
- **2 — Evaluate a structure before using it** — `day: 0` · 5 paso(s) · 1 callout(s): note
- **3 — Download the structure** — `day: 0` · 3 paso(s)
- **4 — Useful PDB tools** — `day: 0` · 3 paso(s) · 1 callout(s): tip

## AlphaFold — Structure Prediction  (`alphafold`)

- **When to use AlphaFold vs a crystal structure** — `day: 0` · 2 paso(s) · 1 callout(s): warn
- **1 — AlphaFold database (pre-computed models)** — `day: 0` · 4 paso(s)
- **2 — Understanding pLDDT (confidence score)** — `day: 0` · 0 paso(s) · 1 callout(s): note
- **3 — AlphaFold3 / ColabFold for custom predictions** — `day: 0` · 3 paso(s)
    - `sequenceWaitRange` = 10.0 – 30.0 min  ·  TODO: and wait ⟨10–30 min⟩
- **4 — PAE plot (for multimers)** — `day: 0` · 0 paso(s) · 2 callout(s): note/tip

## PyMOL — Getting Started  (`pymol`)

- **The PyMOL interface — what you're looking at** — `day: 0` · 4 paso(s)
- **Loading a structure** — `day: 0` · 3 paso(s)
- **Essential commands (type in the command line)** — `day: 0` · 0 paso(s)
- **Useful selections** — `day: 0` · 0 paso(s) · 1 callout(s): note
- **Aligning two structures** — `day: 0` · 3 paso(s) · 1 callout(s): tip

## PyMOL — Publication-Quality Figures  (`pymolfig`)

- **Standard figure setup** — `day: 0` · 8 paso(s)
- **Useful colour schemes** — `day: 0` · 0 paso(s)
- **H-bonds and interactions** — `day: 0` · 3 paso(s) · 1 callout(s): tip

## Binding Site & Pocket Analysis  (`pockets`)

- **Case 1 — Structure has a known ligand (easiest)** — `day: 0` · 4 paso(s)
- **Case 2 — Apo structure or no ligand (use CASTp)** — `day: 0` · 5 paso(s)
- **Druggability assessment** — `day: 0` · 0 paso(s) · 1 callout(s): note
- **Comparing pockets between structures (conformational changes)** — `day: 0` · 3 paso(s) · 1 callout(s): tip

## Ternary Complex Modelling (PROTAC)  (`ternary`)

- **Why model it?** — `day: 0` · 3 paso(s)
- **Step 1 — Gather your starting structures** — `day: 0` · 3 paso(s)
- **Step 2 — Predict the ternary complex** — `day: 0` · 3 paso(s)
- **Step 3 — Evaluate the model in PyMOL** — `day: 0` · 6 paso(s)
- **Step 4 — Linker length estimation** — `day: 0` · 0 paso(s) · 2 callout(s): note/tip

## TR-FRET — Ternary Complex Formation  (`trfret`)

- **Principle &amp; key parameters** — `day: 0` · 5 paso(s)
    - `nmAcceptorRatioX` = 0.0 ×  ·  TODO: acceptor Ratio ⟨000 ×⟩ nm nm
    - `typicallyPct` = 1.0 %  ·  TODO: typically ⟨1%⟩ DMSO final
    - `flatUpPct` = 1.0 %  ·  TODO: up to ⟨1%⟩ and drop
    - `dropOnlyAbovePct` = 2.0 %  ·  TODO: only above ⟨2%⟩
- **Reagents &amp; setup** — `day: 0` · 5 paso(s)
    - `bufferConc` = 25.0 mM  ·  TODO: Buffer ⟨25 mM⟩ HEPES pH
    - `mmHepesPhConc` = 150.0 mM  ·  TODO: HEPES pH ⟨150 mM⟩ NaCl mM
    - `phMmNaclConc` = 0.5 mM  ·  TODO: mM NaCl ⟨0.5 mM⟩ TCEP Tween
    - `phNaclTcepPct` = 0.05 %  ·  TODO: NaCl TCEP ⟨0.05%⟩ Tween BSA
    - `naclTcepTweenPct` = 0.1 %  ·  TODO: TCEP Tween ⟨0.1%⟩ BSA Prepare
    - `bdCheckPurityPct` = 90.0 %  ·  TODO: Check purity ⟨90%⟩ by SDS
    - `wallsMaximiseSignalRange` = 10.0 – 20.0 µL  ·  TODO: maximise signal ⟨10–20 µL⟩ total reaction
    - `doseResponseTypicallyConc` = 10.0 µM  ·  TODO: response typically ⟨10 µM⟩ nM fold
    - `doseResponseTypicallyConc2` = 0.1 nM  ·  TODO: response typically ⟨0.1 nM⟩ fold dilutions
    - `foldDilutionsPct` = 100.0 %  ·  TODO: dilutions in ⟨100%⟩ DMSO then
    - `assayAchievePct` = 1.0 %  ·  TODO: to achieve ⟨1%⟩ DMSO final
    - `dmsoDiluteRatio` = 100.0   ·  TODO: then dilute ⟨1:100⟩ into assay
- **Optimisation (stepwise, after Lin &amp; Chen, ACS Pharmacol. Transl. Sci. 2021)** — `day: 0` · 5 paso(s)
    - `titrateDonorAbConc` = 8.0 nM  ·  TODO: donor Ab ⟨8 nM⟩ and acceptor
    - `acceptorAbConc` = 16.0 nM  ·  TODO: acceptor Ab ⟨16 nM⟩ in matrix
    - `tbAntiHisConc` = 2.0 nM  ·  TODO: anti His ⟨2 nM⟩ AF anti
    - `afAntiGstConc` = 4.0 nM  ·  TODO: anti GST ⟨4 nM⟩
    - `titratePoiConc` = 20.0 nM  ·  TODO: POI and ⟨20 nM⟩ each For
    - `protacsGstBrdConc` = 2.0 nM  ·  TODO: GST BRD ⟨2 nM⟩ His CRBN
    - `hisCrbnDdbConc` = 8.0 nM  ·  TODO: CRBN DDB ⟨8 nM⟩ ratio is
    - `minTypicallyRange` = 120.0 – 180.0 min  ·  TODO: min Typically ⟨120–180 min⟩ at RT
    - `measureSignalMin` = 300.0 min  ·  TODO: signal at ⟨300 min⟩ Typically at
    - `valPct` = 4.0 %  ·  TODO: add ⟨4%⟩ DMSO Assay
    - `stablePct` = 1.0 %  ·  TODO: stable at ⟨1%⟩ DMSO
- **Protocol — 384-well setup (20 uL)** — `day: 0` · 7 paso(s) · 2 callout(s): note/tip
    - `prepareAssayBufferConc` = 25.0 mM  ·  TODO: assay buffer ⟨25 mM⟩ HEPES pH
    - `mmHepesPhConc2` = 50.0 mM  ·  TODO: HEPES pH ⟨50 mM⟩ NaCl mM
    - `phMmNaclConc2` = 2.0 mM  ·  TODO: mM NaCl ⟨2 mM⟩ TCEP Tween
    - `naclTcepPct` = 0.005 %  ·  TODO: NaCl TCEP ⟨0.005%⟩ Tween Prepare
    - `valConc` = 25.0 nM  ·  TODO: ⟨25 nM⟩
    - `valConc2` = 2.5 nM  ·  TODO: ⟨2.5 nM⟩
    - `valConc3` = 0.25 nM  ·  TODO: ⟨0.25 nM⟩
    - `wellVol` = 20.0 µL  ·  TODO: ⟨20 µL⟩ well
    - `valMin` = 17.0 hours  ·  TODO: ⟨17 hours⟩

## Fluorescence Polarization (FP)  (`fp`)

- **Principle** — `day: 0` · 4 paso(s)
    - `polarizationMpX` = 1000.0 ×  ·  TODO: Polarization mP ⟨1000 ×⟩
    - `poiBrdX` = 10.0 ×  ·  TODO: BRD at ⟨10×⟩
- **VHL FP assay — reagents** — `day: 0` · 4 paso(s)
    - `hifPeptideTracerConc` = 10.0 nM  ·  TODO: peptide Tracer ⟨10 nM⟩ at or
    - `soCompetitionConc` = 10.0 nM  ·  TODO: ⟨10 nM⟩ so the
    - `typicalAssayConcentratConc` = 200.0 nM  ·  TODO: assay concentration ⟨200 nM⟩
    - `bufferConc` = 25.0 mM  ·  TODO: Buffer ⟨25 mM⟩ HEPES pH
    - `mmHepesPhConc` = 150.0 mM  ·  TODO: HEPES pH ⟨150 mM⟩ NaCl mM
    - `phMmNaclConc` = 0.5 mM  ·  TODO: mM NaCl ⟨0.5 mM⟩ TCEP Tween
    - `phNaclTcepPct` = 0.01 %  ·  TODO: NaCl TCEP ⟨0.01%⟩ Tween No
    - `minimiseBackgroundFluoRange` = 20.0 – 50.0 µL  ·  TODO: background fluorescence ⟨20–50 µL⟩ reaction volume
- **VHL FP assay protocol** — `day: 0` · 7 paso(s)
    - `pointsFoldTopConc` = 500.0 µM  ·  TODO: fold top ⟨500 µM⟩ Maximum DMSO
    - `foldTopMaximumPct` = 1.0 %  ·  TODO: top Maximum ⟨1%⟩ DMSO final
    - `bufferPreIncubateMin` = 30.0 min  ·  TODO: Pre incubate ⟨30 min⟩ on ice
    - `mixVcbX` = 2.0 ×  ·  TODO: VCB at ⟨2×⟩ final FAM
    - `famTracerX` = 2.0 ×  ·  TODO: tracer at ⟨2×⟩ final in
    - `valVol` = 10.0 µL  ·  TODO: Add ⟨10 µL⟩ compound to
    - `wellsVol` = 10.0 µL  ·  TODO: wells add ⟨10 µL⟩ protein tracer
    - `tracerMixTotalVol` = 20.0 µL  ·  TODO: mix Total ⟨20 µL⟩
    - `incubateRange` = 30.0 – 60.0 min  ·  TODO: Incubate ⟨30–60 min⟩ at RT
    - `proteinX` = 10.0 ×  ·  TODO: if protein ⟨10×⟩
- **CRBN FP assay — notes** — `day: 0` · 4 paso(s)
    - `lenalidomideDerivativeConc` = 50.0 nM  ·  TODO: derivative Tracer ⟨50 nM⟩
    - `crbnDdbComplexConc` = 500.0 nM  ·  TODO: DDB complex ⟨500 nM⟩ Avoid CRBN
    - `lenalidomideConc` = 5.0 µM  ·  TODO: ⟨5 µM⟩ lenalidomide
    - `lenalidomideConc2` = 50.0 µM  ·  TODO: lenalidomide ⟨50 µM⟩
- **Cooperativity by FP** — `day: 0` · 4 paso(s) · 1 callout(s): tip
    - `brdBdX` = 10.0 ×  ·  TODO: BD at ⟨10×⟩

## SPR (Biacore) — Binary & Ternary Kinetics  (`spr`)

- **SPR assay design — ternary complex** — `day: 0` · 4 paso(s)
    - `protacAloneTypicallyX` = 10.0 ×  ·  TODO: alone typically ⟨10×⟩
    - `ltConc` = 100.0 nM  ·  TODO: lt ⟨100 nM⟩ slow
    - `bdProtacMin` = 30.0 min  ·  TODO: with PROTAC ⟨30 min⟩ on ice
    - `saturatingPoiConc` = 10.0 µM  ·  TODO: saturating POI ⟨10 µM⟩ BRD BD
    - `brdBdConc` = 1.0 µM  ·  TODO: BD with ⟨1 µM⟩ PROTAC on
- **Running buffer &amp; surface prep** — `day: 0` · 4 paso(s)
    - `pbsCytivaConc` = 10.0 mM  ·  TODO: Cytiva or ⟨10 mM⟩ HEPES pH
    - `mmHepesPhConc` = 150.0 mM  ·  TODO: HEPES pH ⟨150 mM⟩ NaCl Tween
    - `mmNaclTweenConc` = 0.5 mM  ·  TODO: NaCl Tween ⟨0.5 mM⟩ TCEP Degas
    - `hepesPhNaclPct` = 0.005 %  ·  TODO: pH NaCl ⟨0.005%⟩ Tween TCEP
    - `smallMoleculesPct` = 2.0 %  ·  TODO: molecules add ⟨2%⟩ DMSO if
    - `performDmsoCalibrationPct` = 3.0 %  ·  TODO: DMSO calibration ⟨3%⟩ DMSO point
    - `glycinePhPulseMin` = 5.0 s  ·  TODO: pH pulse ⟨5 s⟩ or NaCl
    - `dissociatesSlowlyShortConc` = 10.0 mM  ·  TODO: slowly short ⟨10 mM⟩ glycine pH
    - `phPulseConc` = 1.0 M  ·  TODO: pulse or ⟨1 M⟩ NaCl pulse
- **Protocol — binary binding (PROTAC vs. immobilised VCB)** — `day: 0` · 5 paso(s)
    - `conditionChipX` = 3.0 ×  ·  TODO: chip with ⟨3×⟩ buffer injections
    - `saSitesMin` = 1.0 min  ·  TODO: sites with ⟨1 min⟩ biotin injections
    - `vcbBiotinVol` = 5.0 µL  ·  TODO: biotin at ⟨5 µL⟩ min until
    - `saChipInjectConc` = 50.0 nM  ·  TODO: chip inject ⟨50 nM⟩ VCB biotin
    - `saSitesX` = 3.0 ×  ·  TODO: sites with ⟨3×⟩ biotin injections
    - `dmsoFinalTypicalConc` = 1.3 nM  ·  TODO: final Typical ⟨1.3 nM⟩ points fold
    - `runningBufferPct` = 1.0 %  ·  TODO: running buffer ⟨1%⟩ DMSO final
    - `dissociationFlowRateRange` = 30.0 – 100.0 µL  ·  TODO: flow rate ⟨30–100 µL⟩ min Double
    - `concentrationAssociatiMin` = 120.0 s  ·  TODO: concentration association ⟨120 s⟩ dissociation flow
    - `concentrationAssociatiMin2` = 300.0 s  ·  TODO: association dissociation ⟨300 s⟩ flow rate
    - `fitRatio` = 1.0   ·  TODO: Fit to ⟨1:1⟩ Langmuir model
- **Protocol — ternary complex (pre-formed PROTAC:POI vs. VCB)** — `day: 0` · 5 paso(s)
    - `runningBufferMin` = 30.0 min  ·  TODO: running buffer ⟨30 min⟩ on ice
    - `saturatingPoiConc2` = 10.0 µM  ·  TODO: saturating POI ⟨10 µM⟩ BRD BD
    - `bdTitratedProtacConc` = 12.0 nM  ·  TODO: titrated PROTAC ⟨12 nM⟩ in running
    - `withoutRegenerationAssMin` = 100.0 s  ·  TODO: regeneration association ⟨100 s⟩ per concentration
    - `concentrationFinalDissMin` = 1200.0 s  ·  TODO: final dissociation ⟨1200 s⟩ Minimises surface
    - `fitRatio2` = 1.0   ·  TODO: fit to ⟨1:1⟩ model The
- **Interpreting results in the degrader context** — `day: 0` · 4 paso(s) · 1 callout(s): tip
    - `valMin` = 0.006 s  ·  TODO: ⟨0.006 s⟩
    - `asympMin` = 130.0 s  ·  TODO: asymp ⟨130 s⟩ Roy et
