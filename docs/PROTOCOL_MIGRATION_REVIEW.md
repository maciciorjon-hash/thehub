# Protocol parameters — review list

Every parameter extracted from the 33 Archive protocols, with the label it now shows in the UI.
Generated from `PROTOCOL_DATA`; regenerate with `migrate_protocols.py` + the rename step.
Totals: **561 parameters** across **153 stages** in 33 protocols.
(The stage count read 118 until 2026-08-22; it was counted before the last split of the
CRISPR variants. Verified by parsing PROTOCOL_DATA.)


**How to read this.** `key` is what appears as `{{p.key}}` in the step prose and as `data-p` on
the rendered span. The label is what a person sees when editing the value in Labbook.

`day` is the stage's offset from the experiment start. It is only set where the protocol states
it explicitly (3 stages). The rest are 0 by design — they get set in Labbook's experiment
timeline, in context, not guessed here.

## Gibson Assembly  (`gibson`)

**1 — Design overlapping primers (before PCR)**

| key | value | label |
|---|---|---|
| `overlapLen` | 15.0–30.0 bp | Primer overlap length |
| `primerTm` | 60.0 °C | Primer binding Tm |

**2 — PCR → DpnI → gel purification (one continuous workflow)**

| key | value | label |
|---|---|---|
| `dpniTemp` | 37.0 °C | DpnI digest temp |
| `dpniTime` | 60.0 min | DpnI digest time |
| `loadingDyeX` | 6.0 × | DNA loading dye strength |
| `agarosePct` | 1.0 % | Agarose gel % |

**3 — Gibson assembly reaction**

| key | value | label |
|---|---|---|
| `masterMixX` | 2.0 × | HiFi Master Mix strength |
| `vectorAmt` | 0.06 pmol | Vector amount |
| `insertExcess` | 2.0 × | Insert molar excess |
| `assemblyTemp` | 50.0 °C | Assembly temp |
| `assemblyTimeFew` | 15.0 min | Assembly time (2–3 fragments) |
| `assemblyTimeMany` | 60.0 min | Assembly time (4–6 fragments) |
| `storageTemp` | -20.0 °C | Storage temp |
| `transformVol` | 2.0 uL | Volume to transform |

## Restriction Enzyme Cloning (NEB)  (`redigest`)

**2 — Digest reaction**

| key | value | label |
|---|---|---|
| `digestTemp` | 37.0 °C | Digest temp (most NEB enzymes) |
| `digestTime` | 60.0 min | Digest time |
| `digestTimeTS` | 15.0 min | Digest time (Time-Saver enzymes) |
| `hiTemp` | 65.0 °C | Heat-inactivation temp |
| `hiTempHF` | 80.0 °C | Heat-inactivation temp (HF enzymes) |
| `hiTime` | 20.0 min | Heat-inactivation time |
| `hiTimeHF` | 20.0 min | Heat-inactivation time (HF enzymes) |

**3 — Gel verification and purification**

| key | value | label |
|---|---|---|
| `gelPct` | 0.8–1.0 % | Agarose gel % |
| `gelEluteVol` | 15.0–20.0 µL | Gel-extraction elution volume |

**4 — Dephosphorylation of vector (recommended for single digests)**

| key | value | label |
|---|---|---|
| `cipTemp` | 37.0 °C | Dephosphorylation temp |
| `cipTime` | 10.0 min | Dephosphorylation time |
| `cipVol` | 1.0 µL | Quick CIP / rSAP volume |
| `cipHiTempQuick` | 80.0 °C | CIP inactivation temp (Quick CIP) |
| `cipHiTempRsap` | 65.0 °C | CIP inactivation temp (rSAP) |
| `cipHiTimeQuick` | 2.0 min | CIP inactivation time (Quick CIP) |
| `cipHiTimeRsap` | 5.0 min | CIP inactivation time (rSAP) |

**5 — Ligation**

| key | value | label |
|---|---|---|
| `ligaseBufferX` | 10.0 × | T4 Ligase Buffer strength |
| `ligTemp` | 16.0 °C | Standard ligation temp |
| `ligTime` | 16.0 h | Standard ligation time |
| `quickLigTime` | 5.0–15.0 min | Quick Ligation time |
| `quickLigTemp` | 25.0 °C | Quick Ligation temp |
| `ligHiTemp` | 65.0 °C | Ligase inactivation temp |
| `ligHiTime` | 10.0 min | Ligase inactivation time |
| `transformVol` | 2.0–5.0 µL | Volume to transform |

## Transformation of Competent Cells  (`transfo`)

**Preparation**

| key | value | label |
|---|---|---|
| `thawTimeDh5a` | 20.0–30.0 min | Thaw time (DH5α) |
| `thawTimeStable` | 5.0–10.0 min | Thaw time (NEB Stable) |
| `plateWarmTemp` | 37.0 °C | Plate pre-warm temp |

**Transformation**

| key | value | label |
|---|---|---|
| `dnaVol` | 1.0–5.0 µL | Plasmid DNA volume |
| `cellsVol` | 25.0–50.0 µL | Competent cells volume |
| `dnaMaxAmt` | 100.0 ng | Max plasmid DNA |
| `iceTimeBefore` | 2.0 min | Ice incubation before shock |
| `shockTime` | 30.0–60.0 s | Heat-shock time |
| `shockTemp` | 42.0 °C | Heat-shock temp |
| `shockTimeDh5a` | 45.0 s | Heat-shock time (DH5α) |
| `shockTimeStable` | 30.0 s | Heat-shock time (NEB Stable) |
| `iceTimeAfter` | 2.0 min | Ice incubation after shock |
| `recoveryShake` | 200.0–250.0 rpm | Recovery shaking speed |
| `recoveryTemp` | 37.0 °C | Recovery temp |
| `recoveryTime` | 1.0 h | Recovery time |
| `recoveryVol` | 450.0 µL | Recovery medium volume |
| `recoveryTempLenti` | 30.0 °C | Recovery temp (lentiviral) |

**Plating**

| key | value | label |
|---|---|---|
| `platingVol` | 50.0 µL | Plating volume |
| `plateTemp` | 37.0 °C | Plate incubation temp |
| `plateTempLenti` | 30.0 °C | Plate incubation temp (lentiviral) |

**Colony selection**

| key | value | label |
|---|---|---|
| `cultureShake` | 150.0–200.0 rpm | Overnight culture shaking |
| `cultureTemp` | 37.0 °C | Overnight culture temp |
| `cultureVol` | 5.0 mL | Overnight culture volume |
| `cultureTubeVol` | 15.0 mL | Culture tube size |

## Miniprep — GeneJET  (`miniprep`)

**1 — Harvest &amp; lyse**

| key | value | label |
|---|---|---|
| `pelletTime` | 2.0 min | Pellet spin time |
| `cultureVol` | 5.0 mL | Culture volume |
| `pelletSpeed` | 8000.0 rpm | Pellet spin speed |
| `resuspVol` | 250.0 µL | Resuspension Solution volume |
| `lysisVol` | 250.0 µL | Lysis Solution volume |
| `lysisInverts` | 4.0–6.0 × | Lysis inversions |
| `neutrVol` | 350.0 µL | Neutralization Solution volume |
| `neutrInverts` | 4.0–6.0 × | Neutralization inversions |
| `debrisSpinTime` | 5.0 min | Debris spin time |

**2 — Bind, wash &amp; elute**

| key | value | label |
|---|---|---|
| `bindSpinTime` | 1.0 min | Binding spin time |
| `washVol` | 500.0 µL | Wash Solution volume |
| `washSpinTime` | 30.0–60.0 s | Wash spin time |
| `drySpinTime` | 1.0 min | Membrane drying spin |
| `eluteTubeVol` | 1.5 mL | Elution tube size |
| `eluteVol` | 50.0 µL | Elution volume |
| `eluteTemp` | 65.0 °C | Elution buffer temp |
| `eluteWait` | 2.0 min | Elution incubation |
| `eluteSpinTime` | 2.0 min | Elution spin time |

## NucleoSpin Gel & PCR Clean-up  (`nucleospin`)

**PCR cleanup mode**

| key | value | label |
|---|---|---|
| `pcrSampleVol` | 100.0 µL | PCR sample volume |
| `ntiVol` | 200.0 µL | Buffer NTI volume |
| `bindSpinTime` | 30.0 s | Binding spin time |
| `columnLoadVol` | 700.0 µL | Max load per spin |
| `washSpinTime` | 30.0 s | Wash spin time |
| `washVol` | 700.0 µL | NT3 wash volume |
| `drySpinTime` | 1.0 min | Drying spin time |
| `eluteVol` | 15.0–20.0 µL | Elution volume |
| `eluteWait` | 1.0 min | Elution wait at RT |
| `eluteSpinTime` | 1.0 min | Elution spin time |

**Gel extraction mode**

| key | value | label |
|---|---|---|
| `gelNtiVol` | 200.0 µL | NTI buffer per gel mass |
| `gelSliceMass` | 100.0 mg | Gel mass NTI refers to |
| `gelDissolveTime` | 5.0–10.0 min | Gel dissolving time |
| `gelDissolveTemp` | 50.0 °C | Gel dissolving temp |
| `gelBindSpinTime` | 30.0 s | Binding spin time (gel) |
| `gelWashSpinTime` | 30.0 s | Wash spin time (gel) |
| `gelDrySpinTime` | 1.0 min | Drying spin time (gel) |
| `gelWashVol` | 700.0 µL | NT3 wash volume (gel) |
| `gelEluteVol` | 15.0–20.0 µL | Elution volume (gel) |
| `gelEluteTemp` | 70.0 °C | Elution buffer temp (large fragments) |
| `gelEluteWait` | 1.0 min | Elution wait at RT (gel) |
| `gelEluteSpinTime` | 1.0 min | Elution spin time (gel) |

## gRNA & Donor Design  (`grna`)

**2 — Select region of interest**

| key | value | label |
|---|---|---|
| `regionLen` | 200.0 bp | Design region length |

**3 — Design gRNA candidates (IDT)**

| key | value | label |
|---|---|---|
| `idtRegionLen` | 200.0 bp | Region pasted into IDT tool |

**4 — (Knock-in) design the donor template (ssODN)**

| key | value | label |
|---|---|---|
| `seedLen` | 12.0 bp | Seed region length |
| `donorMaxLen` | 200.0 bp | Max donor length |
| `armLen5` | 50.0–80.0 bp | 5′ homology arm length |
| `armLen3` | 50.0–80.0 bp | 3′ homology arm length |
| `ultramerCutoff` | 60.0 nt | Ultramer length cutoff |

**5 — Pre-plan controls and record-keeping**

| key | value | label |
|---|---|---|
| `ampliconLen` | 200.0–300.0 bp | Genotyping amplicon length |

## CRISPR Knockout  (`crispr-ko`)

> Method variants: `px458` PX458 Plasmid (Lipofectamine/FuGENE), `rnp` RNP Electroporation

**ssOligo design &amp; order (IDT)** — variant `px458`

| key | value | label |
|---|---|---|
| `spacerLen` | 20.0 bp | gRNA spacer length |
| `ssOligoLen` | 70.0 nt | ssOligo insert total length |
| `armLen5` | 25.0 bp | 5′ homology arm length |
| `oligoSpacerLen` | 20.0 bp | gRNA spacer in oligo |
| `armLen3` | 25.0 bp | 3′ homology arm length |
| `orderScale` | 100.0 nmol | Oligo synthesis scale |
| `naclConc` | 50.0 mM | NaCl in TE buffer |
| `oligoStockConc` | 100.0 µM | ssOligo stock concentration |
| `oligoStoreTemp` | -20.0 °C | ssOligo storage temp |
| `workStockConc` | 1.0 µM | Working stock concentration |
| `workStockDnaVol` | 1.0 µL | Stock volume to dilute |
| `workStockBufferVol` | 99.0 µL | Buffer volume for dilution |
| `workStockSrcConc` | 100.0 µM | Stock concentration diluted from |

**Plasmid linearisation (BbsI digest)** — variant `px458`

| key | value | label |
|---|---|---|
| `px458Amt` | 1.0 µg | PX458 to digest |
| `bbsiTemp` | 37.0 °C | BbsI digest temp |
| `bbsiTime` | 30.0 min | BbsI digest time |
| `agarosePct` | 1.0 % | Agarose gel % |

**HiFi assembly &amp; transformation** — variant `px458`

| key | value | label |
|---|---|---|
| `assemblyTemp` | 50.0 °C | HiFi assembly temp |
| `assemblyTime` | 60.0 min | HiFi assembly time |
| `assemblyLidTemp` | 55.0 °C | Thermocycler lid temp |
| `transformVol` | 2.0 µL | Volume to transform |
| `shockTemp` | 42.0 °C | Heat-shock temp |
| `shockTime` | 30.0 s | Heat-shock time |
| `ampConc` | 100.0 µg/mL | Ampicillin concentration |

**Day 1 — Transfection (FugeneHD, 6-well plate)** — variant `px458`, **day 1**

| key | value | label |
|---|---|---|
| `transfectDnaAmt` | 1.0 µg | PX458-gRNA plasmid per well |
| `optiMemVolA` | 100.0 µL | Opti-MEM volume (tube A) |
| `fugeneVol` | 3.0 µL | FugeneHD volume |
| `optiMemVolB` | 100.0 µL | Opti-MEM volume (tube B) |
| `complexTime` | 5.0 min | Complex formation time at RT |

**Day 2–3 — FACS sorting** — variant `px458`, **day 2**

| key | value | label |
|---|---|---|
| `gfpExpressTime` | 24.0–48.0 h | Time to GFP expression |

**Reconstitution — TracrRNA &amp; crRNA** — variant `rnp`

| key | value | label |
|---|---|---|
| `tracrBufferVol` | 200.0 µL | Duplex buffer for tracrRNA |
| `tracrAmt` | 20.0 nmol | tracrRNA amount supplied |
| `tracrStockConc` | 100.0 µM | tracrRNA stock concentration |
| `crrnaBufferVol` | 20.0 µL | Duplex buffer for crRNA |
| `crrnaAmt` | 2.0 nmol | crRNA amount supplied |
| `crrnaStockConc` | 100.0 µM | crRNA stock concentration |

**Reconstitution — Cas9** — variant `rnp`

| key | value | label |
|---|---|---|
| `cas9ReconVol` | 50.0 µL | Cas9 reconstitution volume |
| `cas9Conc` | 1.0 µg | Cas9 concentration after reconstitution |
| `cas9DissolveTime` | 10.0 min | Cas9 dissolving time on ice |

**Anneal TracrRNA + crRNA** — variant `rnp`

| key | value | label |
|---|---|---|
| `annealVol` | 5.0 µL | Volume of each RNA to anneal |
| `annealTemp` | 95.0 °C | Annealing temp |
| `annealTime` | 5.0 min | Annealing time |

**RNP complex formation (per 2 electroporations, ~0.4M cells)** — variant `rnp`

| key | value | label |
|---|---|---|
| `rnpTime` | 20.0 min | RNP complex formation time |

**Cell preparation** — variant `rnp`

| key | value | label |
|---|---|---|
| `pbsResuspendVol` | 1.0 mL | PBS resuspension volume |
| `platingMediaVol` | 2.0 mL | Media per 6-well |

**Electroporation** — variant `rnp`

| key | value | label |
|---|---|---|
| `falconVol` | 50.0 mL | Falcon size for ethanol |
| `electrolyteVol` | 3.0 mL | Electrolyte solution volume |
| `electroporationVol` | 10.0 µL | Volume per electroporation |
| `recoveryTime` | 48.0–72.0 h | Recovery before sorting |

**After electroporation — pool validation (before single-cell sorting)** — variant `rnp`

| key | value | label |
|---|---|---|
| `poolTime` | 48.0–72.0 h | Pooled culture before analysis |
| `indelTarget` | 70.0 % | Target indel % before sorting |
| `indelGoNoGo` | 70.0 % | Go/no-go indel threshold |

## CRISPR Knock-in  (`crispr-ki`)

> Method variants: `px458` PX458 + Plasmid Donor, `rnp` RNP Electroporation + ssODN

**Design &amp; order ssOligo insert** — variant `px458`

| key | value | label |
|---|---|---|
| `spacerLen` | 20.0 bp | gRNA spacer length |
| `oligoArmLen5` | 25.0 bp | 5′ homology arm (cloning oligo) |
| `oligoSpacerLen` | 20.0 bp | gRNA spacer in oligo |
| `oligoArmLen3` | 25.0 bp | 3′ homology arm (cloning oligo) |
| `workStockConc` | 1.0 µM | ssOligo working stock |

**Plasmid linearisation (BbsI digest)** — variant `px458`

| key | value | label |
|---|---|---|
| `px458Amt` | 1.0 µg | PX458 to digest |
| `bbsiTemp` | 37.0 °C | BbsI digest temp |
| `bbsiTime` | 30.0 min | BbsI digest time |
| `agarosePct` | 1.0 % | Agarose gel % |

**HiFi assembly &amp; transformation** — variant `px458`

| key | value | label |
|---|---|---|
| `assemblyTemp` | 50.0 °C | HiFi assembly temp |
| `assemblyTime` | 60.0 min | HiFi assembly time |
| `assemblyLidTemp` | 55.0 °C | Thermocycler lid temp |
| `transformVol` | 2.0 µL | Volume to transform |
| `plateTemp` | 37.0 °C | Plate incubation temp |
| `ampConc` | 100.0 µg/mL | Ampicillin concentration |

**2 — Plasmid donor design** — variant `px458`

| key | value | label |
|---|---|---|
| `donorArmLen5` | 400.0–800.0 bp | Left homology arm (plasmid donor) |
| `donorArmLen3` | 400.0–800.0 bp | Right homology arm (plasmid donor) |
| `snpDistance` | 10.0–15.0 bp | Diagnostic SNP distance from cut |

**3 — Transfection (Lipofectamine 3000)** — variant `px458`

| key | value | label |
|---|---|---|
| `seedConfluency` | 60.0–70.0 % | Seeding confluency |
| `transfectDonorAmt` | 3.0–4.0 µg | Plasmid donor per well |
| `transfectCas9Amt` | 1.5 µg | PX458 per well |
| `cas9DonorRatio` | 2.0 | Cas9:donor ratio |
| `gfpCheckTime` | 24.0–48.0 h | Time before GFP check |
| `gfpExpected` | 20.0–60.0 % | Expected GFP+ fraction |
| `noSelectionTime` | 48.0 h | No antibiotic selection window |

**4 — FACS sorting &amp; clonal expansion** — variant `px458`

| key | value | label |
|---|---|---|
| `sortTime` | 48.0 h | Time to sorting |
| `sortHepesConc` | 10.0 mM | HEPES in sorting buffer |
| `sortFbsPct` | 2.0 % | FBS in sorting buffer |
| `sortGate` | 10.0–20.0 % | GFP+ gate (top %) |

**1 — ssODN design** — variant `rnp`

| key | value | label |
|---|---|---|
| `ssodnLen` | 100.0–200.0 nt | ssODN total length |
| `ssodnArmLen` | 40.0–80.0 nt | ssODN homology arm each side |
| `ssodnSnpDistance` | 10.0 bp | Diagnostic SNP distance from cut |
| `ssodnStockConc` | 100.0 µM | ssODN stock concentration |
| `desaltMaxLen` | 120.0 nt | Max length for desalted synthesis |
| `pageMinLen` | 120.0 nt | Length above which to PAGE-purify |

**2 — RNP assembly (IDT Alt-R system)** — variant `rnp`

| key | value | label |
|---|---|---|
| `rnaStockConc` | 200.0 µM | crRNA / tracrRNA stock |
| `annealTemp` | 95.0 °C | Annealing temp |
| `annealTime` | 5.0 min | Annealing time |
| `duplexConc` | 100.0 µM | Final gRNA duplex concentration |
| `rnpCas9Vol` | 1.0 µL | Cas9 volume |
| `rnpGrnaVol` | 1.0 µL | gRNA volume |
| `rnpCas9Conc` | 61.0 µM | Cas9 concentration |
| `rnpGrnaConc` | 100.0 µM | gRNA concentration |
| `rnpRatio` | 1.0 | gRNA:Cas9 volume ratio |
| `rnpTime` | 10.0–15.0 min | RNP complex formation time |

**3 — Electroporation** — variant `rnp`

| key | value | label |
|---|---|---|
| `harvestConfluency` | 70.0–80.0 % | Harvest confluency |
| `minViability` | 90.0 % | Minimum viability |
| `cellsPerReaction` | 1.0–5.0 ×10&#8309; | Cells to pellet |
| `pelletTime` | 5.0 min | Pellet spin time |
| `neonTipVol` | 10.0 µL | Neon tip size |
| `nucleofectorVol` | 20.0 µL | 4D buffer volume |
| `rnpAddVol` | 1.0–2.0 µL | RNP volume added |
| `rnpCas9Amt` | 100.0–200.0 pmol | Cas9 amount added |
| `ssodnAddVol` | 1.0–2.0 µL | ssODN volume added |
| `ssodnAmt` | 100.0–200.0 pmol | ssODN amount added |
| `settleTime` | 10.0 min | Undisturbed recovery time |

**4 — Recovery &amp; clonal expansion** — variant `rnp`

| key | value | label |
|---|---|---|
| `expectedViability` | 50.0–80.0 % | Expected viability |
| `viabilityCheckTime` | 24.0 h | Time to viability check |
| `iceHarvestTime` | 48.0–72.0 h | Time to ICE/T7E1 harvest |
| `expectedIndels` | 20.0–60.0 % | Expected indel % |

**5 — Genotyping HDR clones** — variant `rnp`

| key | value | label |
|---|---|---|
| `genotypeAmpliconLen` | 300.0–600.0 bp | Genotyping amplicon length |
| `gelVisibleInsert` | 20.0 bp | Insert size visible on gel |

## Single Cell Sorting (FACS)  (`scs`)

**Make conditioned media**

| key | value | label |
|---|---|---|
| `condMediaConfluency` | 60.0–70.0 % | Confluency for conditioned media |
| `condMediaTempShort` | 4.0 °C | Conditioned media storage (short) |
| `condMediaTempLong` | -20.0 °C | Conditioned media storage (long) |
| `condMediaSpinTime` | 5.0 min | Conditioned media spin time |
| `condMediaSpeed` | 4000.0 rpm | Conditioned media spin speed |
| `condMediaFbsPct` | 20.0 % | FBS in dilution media |
| `condMediaDilution` | 1.0 | Conditioned media dilution |

**24 h before sorting — prepare 96-well plates**

| key | value | label |
|---|---|---|
| `plateTemp` | 37.0 °C | Plate incubation temp |
| `wellVol` | 150.0 µL | Volume per 96-well |
| `plateCo2` | 5.0 % | CO₂ % |

**1–2 h before sorting**

| key | value | label |
|---|---|---|
| `facsMediaVol` | 10.0 mL | FACS media volume |
| `facsFbsVol` | 100.0 µL | FBS in FACS media |
| `facsDapiVol` | 1.0 µL | DAPI in FACS media |

**30 min before sorting**

| key | value | label |
|---|---|---|
| `sortMaxVol` | 300.0 µL | Max volume for sorting |
| `sortMaxCells` | 2.0 M | Cell count that volume covers |
| `sortFbsPct` | 1.0 % | FBS in sorting media |

**At the sorting facility**

| key | value | label |
|---|---|---|
| `cloneTemp` | 37.0 °C | Clonal expansion temp |
| `cloneTime` | 20.0 days | Undisturbed clonal expansion |

**Clone expansion**

| key | value | label |
|---|---|---|
| `cloneCheckDay` | 20.0 days | Day to check for colonies |
| `cloneFeedVol` | 50.0 µL | Fresh media per chosen well |

## BCA & Sample Prep  (`bca`)

**1 — BCA assay**

| key | value | label |
|---|---|---|
| `stdWellVol` | 25.0 µL | Standard volume per well |
| `bsaLowStd` | 0.125 mg/mL | Lowest BSA standard |
| `lysateVol` | 10.0 µL | Lysate volume |
| `lysateWaterVol` | 50.0 µL | Water volume |
| `sampleWellVol` | 25.0 µL | Sample volume per well |
| `lysateDilution` | 6.0 | Lysate dilution |
| `lysateDilutionHigh` | 10.0 | Dilution for concentrated samples |
| `devTemp` | 37.0 °C | Colour development temp |
| `mixTime` | 1.0 min | Plate mixing time |
| `devTime` | 30.0 min | Colour development time |
| `bcaReagentVol` | 200.0 µL | BCA reagent volume |
| `mixSpeed` | 600.0 rpm | Plate mixing speed |

## Western Blot  (`westernblot`)

**Cell lysis**

| key | value | label |
|---|---|---|
| `precoolTemp` | 4.0 °C | Centrifuge pre-cool temp |
| `ripaVol6` | 50.0–100.0 uL | RIPA per 6-well |
| `ripaVol12` | 50.0 uL | RIPA per 12-well |
| `piFinalX` | 1.0 × | Protease inhibitor (final) |
| `piStockX` | 100.0 × | Protease inhibitor stock |
| `benzonaseX` | 1000.0 × | Benzonase dilution |
| `lysisTime` | 10.0 min | Lysis time in fridge |
| `clearTemp` | 4.0 °C | Clearing spin temp |
| `clearTime` | 15.0 min | Clearing spin time |
| `lysateStoreTemp` | -80.0 °C | Lysate storage temp |

**BCA protein quantification**

| key | value | label |
|---|---|---|
| `stdWellVol` | 25.0 uL | Standard volume per well |
| `bsaLowStd` | 0.125 mg/mL | Lowest BSA standard |
| `lysateVol` | 10.0 uL | Lysate volume |
| `lysateWaterVol` | 50.0 uL | Water volume |
| `lysateDilution` | 6.0 | Lysate dilution |
| `lysateDilutionHigh` | 10.0 | Dilution for concentrated samples |
| `devTemp` | 37.0 °C | Colour development temp |
| `mixTime` | 1.0 min | Plate mixing time |
| `devTime` | 30.0 min | Colour development time |
| `bcaLoadVol` | 25.0 uL | Standard/sample per well |
| `bcaReagentVol` | 200.0 uL | BCA reagent volume |
| `mixSpeed` | 600.0 rpm | Plate mixing speed |

**SDS-PAGE**

| key | value | label |
|---|---|---|
| `runBufferVol` | 1.0 L | Running buffer volume |
| `runBufferX` | 1.0 × | MOPS working strength |
| `mopsStockX` | 20.0 × | MOPS stock strength |
| `gelPct` | 4.0–12.0 % | Bis-Tris gel % |
| `runTimeH` | 1.0 h | Gel run time (hours) |
| `runTimeMin` | 15.0 min | Gel run time (extra minutes) |
| `ladderVol` | 2.5 uL | Ladder volume |

**Transfer &amp; blotting**

| key | value | label |
|---|---|---|
| `membraneSize` | 7.0 × | Membrane cut size |
| `transferTime` | 90.0 min | Transfer time |
| `ponceauTime` | 1.0 min | Ponceau staining time |
| `preBlockWash` | 5.0 min | Wash before blocking |
| `blockTime` | 1.0 h | Blocking time |
| `postBlockRinse` | 5.0 s | Rinse after blocking |
| `blockMilkPct` | 5.0 % | Milk % for blocking |
| `primaryTemp` | 4.0 °C | Primary incubation temp |
| `primaryMilkPct` | 5.0 % | Milk % for primary |

**Next day**

| key | value | label |
|---|---|---|
| `primaryWashTime` | 5.0–10.0 min | Wash time after primary |
| `primaryWashCount` | 2.0 × | Washes after primary |
| `secondaryTime` | 1.0 h | Secondary incubation time |
| `secondaryDilution` | 4000.0 | Secondary antibody dilution |
| `tubulinDilution` | 4000.0 | hFAB tubulin dilution |
| `finalWashCount` | 3.0–5.0 × | Washes after secondary |
| `finalWashTime` | 5.0–10.0 min | Wash time after secondary |

## Immunoprecipitation  (`ip`)

**Seeding &amp; treatment**

| key | value | label |
|---|---|---|
| `cellsPerPlate` | 1.2 M | Cells per 10 cm plate |
| `treatTime` | 1.0 h | Compound incubation time |

**Lysis**

| key | value | label |
|---|---|---|
| `lysisRipaVol` | 300.0 µL | RIPA per well |
| `piFinalX` | 1.0 × | Protease inhibitor (final) |
| `piStockX` | 100.0 × | Protease inhibitor stock |
| `benzonaseX` | 1000.0 × | Benzonase dilution |
| `lysisTime` | 10.0 min | Lysis time in fridge |
| `clearTime` | 15.0 min | Clearing spin time |
| `clearSpeed` | 13000.0 rpm | Clearing spin speed |
| `proteinPerSample` | 3.0 mg | Protein per sample |

**Immunoprecipitation (RBM39 IgG sc-376531 example)**

| key | value | label |
|---|---|---|
| `splitTotal` | 200.0 µg | Total protein to split |
| `inputAmt` | 100.0 µg | INPUT fraction |
| `ipAmt` | 100.0 µg | IP fraction |
| `abVolPerMg` | 40.0 µL | Antibody volume per mg lysate |
| `abStockConc` | 200.0 µg/mL | Antibody stock concentration |
| `abAmt` | 2.0 µg | Antibody amount |
| `abPerProtein` | 250.0 µg | Protein that antibody covers |
| `iggControlAmt` | 1.0 µg | Control IgG per mg lysate |
| `ipTemp` | 4.0 °C | IP incubation temp |
| `ipTotalVol` | 1.0 mL | IP reaction volume |

**Bead capture**

| key | value | label |
|---|---|---|
| `beadsVol` | 25.0 µL | Beads per sample |
| `beadsWashVol` | 500.0 µL | Bead wash volume |
| `trisConc` | 50.0 mM | Tris in wash buffer |
| `naclConc` | 150.0 mM | NaCl in wash buffer |
| `beadsTemp` | 4.0 °C | Bead binding temp |
| `beadsTime` | 1.0 h | Bead binding time |
| `washVol` | 1000.0 µL | Wash volume |
| `washCount` | 5.0 × | Number of washes |

**Elution**

| key | value | label |
|---|---|---|
| `boilTemp` | 90.0 °C | Boil temp |
| `boilTime` | 10.0 min | Boil time |
| `elutionVol` | 80.0 µL | Loading buffer volume |
| `ldsX` | 4.0 × | LDS strength |
| `dttX` | 10.0 × | DTT strength |

## HiBiT Blotting System (Promega)  (`hibit`)

**(untitled)**

| key | value | label |
|---|---|---|
| `blottingBufferX` | 10.0 × | Blotting Buffer dilution |
| `lgbitX` | 200.0 × | LgBiT dilution |
| `substrateX` | 500.0 × | Luciferase Substrate dilution |
| `membraneTime` | 5.0 min | Membrane incubation time |

## HiBiT Lytic Assay  (`hibitlytic`)

**Protocol**

| key | value | label |
|---|---|---|
| `treatTime` | 4.0–24.0 h | Degrader incubation time |
| `shakeTime` | 1.0 min | Plate shaking time |
| `shakeSpeed` | 300.0 rpm | Plate shaker speed |
| `developTime` | 10.0 min | Signal development time |
| `integrationTime` | 0.3 s | Luminescence integration time |

## CellTiter-Glo® 2.0 — Cell Viability  (`ctg2`)

**Reagent preparation**

| key | value | label |
|---|---|---|
| `thawTempFridge` | 4.0 °C | Overnight thaw temp |
| `thawTempBath` | 22.0 °C | Water bath thaw temp |
| `benchTime` | 10.0–15.0 min | Bench equilibration time |
| `thawMaxTemp` | 25.0 °C | Thaw temp not to exceed |
| `coldStorageTemp` | -65.0 °C | Cold storage temp |
| `equilTempBath` | 22.0 °C | Water bath temp |
| `equilTimeSmall` | 30.0 min | Equilibration time (small volume) |
| `equilTimeLarge` | 100.0 min | Equilibration time (large volume) |
| `volSmall` | 100.0 mL | Reagent volume (small) |
| `volLarge` | 500.0 mL | Reagent volume (large) |

**Cell viability protocol**

| key | value | label |
|---|---|---|
| `plateEquilTime` | 30.0 min | Plate equilibration time |
| `reagentVol96` | 100.0 µL | Reagent per 96-well |
| `mediumVol96` | 100.0 µL | Medium per 96-well |
| `reagentVol384` | 25.0 µL | Reagent per 384-well |
| `mediumVol384` | 25.0 µL | Medium per 384-well |
| `lysisShakeTime` | 2.0 min | Orbital shaking for lysis |
| `stabiliseTime` | 10.0 min | Signal stabilisation time |
| `integrationTime` | 0.25–1.0 s | Luminescence integration time |

## Retro/Lentiviral Transduction  (`lenti`)

**Virus generation**

| key | value | label |
|---|---|---|
| `seedVol` | 10.0 mL | Plating volume (10 cm dish) |
| `transfectConfluency` | 60.0 % | Confluency at transfection |
| `optiMemVolDna` | 300.0 µL | Opti-MEM (DNA tube) |
| `gagPolAmt` | 6.0 µg | Gag-Pol plasmid |
| `transferAmt` | 3.8 µg | Transfer plasmid |
| `envelopeAmt` | 2.0 µg | Envelope plasmid |
| `optiMemVolReagent` | 300.0 µL | Opti-MEM (reagent tube) |
| `transfectReagentVol` | 24.0 µL | Transfection reagent volume |
| `tubeRestTime` | 5.0 min | Tube rest time |
| `complexTime` | 20.0 min | Complex formation time |
| `mediaVol` | 9.0 mL | Pre-warmed media volume |
| `harvestTime` | 24.0 h | Time to virus harvest |
| `refreshVol` | 10.0 mL | Fresh media volume |

**Harvest (24 h after media change)**

| key | value | label |
|---|---|---|
| `virusStoreTemp` | -80.0 °C | Virus storage temp |
| `clearSpinTime` | 5.0 min | Virus clearing spin time |

**Viral infection**

| key | value | label |
|---|---|---|
| `transduceVol` | 2.0 mL | Media per well |
| `transduceCells` | 0.5 M | Cells per well |
| `virusDilution` | 1.0 | Virus:media dilution |
| `transduceTime` | 24.0 h | Transduction time |
| `polybreneVol` | 1.6 µL | Polybrene volume |
| `polybreneMediaVol` | 2.0 mL | Media Polybrene is added to |
| `polybreneConc` | 8.0 µg/mL | Polybrene concentration |
| `selectionStart` | 48.0–72.0 h | Time to start selection |

## Transfection — Forward  (`transfection`)

**Day 0 — Seeding**

| key | value | label |
|---|---|---|
| `seedConfluency` | 70.0–80.0 % | Confluency at transfection |
| `co2Pct` | 5.0 % | CO₂ % |

**Day 1 — Transfection** — **day 1**

| key | value | label |
|---|---|---|
| `complexTime` | 10.0–15.0 min | Complex formation time |
| `complexTimeRange` | 5.0–20.0 min | Complex time (reagent-dependent) |
| `co2PctEndpoint` | 5.0 % | CO₂ % (endpoint incubation) |

## Transfection — Reverse  (`revtx`)

**Transfection conditions (per 12-well)**

| key | value | label |
|---|---|---|
| `dnaAmt` | 800.0 ng | Plasmid DNA per well |
| `fugeneVol` | 2.4 µL | FuGENE HD volume |
| `optiMemVol` | 100.0 µL | Opti-MEM volume |
| `suspensionCells` | 1.5–2.0 ×10&#8309; | Cells in suspension |
| `suspensionVol` | 1.0 mL | Cell suspension volume |

**Cell seeding**

| key | value | label |
|---|---|---|
| `seedCells` | 1.5–2.0 ×10&#8309; | Cells per 12-well |

**Procedure**

| key | value | label |
|---|---|---|
| `complexTime` | 5.0–15.0 min | Complex formation time |
| `overlayCells` | 1.5–2.0 ×10&#8309; | Cells in overlay |
| `overlayVol` | 1.0 mL | Overlay medium volume |
| `incubateTemp` | 37.0 °C | Incubation temp |
| `co2Pct` | 5.0 % | CO₂ % |

## Cell Seeding  (`seeding`)

_No numeric parameters — reference protocol._

## S-Trap Sample Preparation  (`strap`)

**Reduction**

| key | value | label |
|---|---|---|
| `dttWaterVol` | 100.0 µL | Water to dissolve DTT |
| `dttStockConc` | 500.0 mM | DTT stock concentration |
| `dttFinalConc` | 20.0 mM | DTT final concentration |
| `dttMass` | 7.7 mg | DTT per vial |
| `reduceTime` | 20.0–30.0 min | Reduction time |
| `reduceTemp` | 55.0 °C | Reduction temp |

**Alkylation**

| key | value | label |
|---|---|---|
| `alkylatorTeabVol` | 132.0 µL | TEAB added to alkylator vial |
| `teabWorkConc` | 200.0 mM | TEAB working concentration |
| `teabStockConc` | 1.0 M | TEAB stock concentration |
| `alkylatorStockConc` | 375.0 mM | Alkylator stock concentration |
| `alkylatorFinalConc` | 20.0 mM | Alkylator final concentration |
| `alkylateTime` | 10.0 min | Alkylation time |

**Acidify**

| key | value | label |
|---|---|---|
| `acidVol` | 5.0 µL | Acid volume |
| `acidSampleVol` | 45.0 µL | Sample volume |
| `acidPct` | 12.0 % | Phosphoric acid % |
| `acidRatio` | 10.0 | Phosphoric acid ratio |

**Trap protein on S-Trap**

| key | value | label |
|---|---|---|
| `bindTeabVol` | 1.0 mL | TEAB in binding buffer |
| `bindMeohVol` | 9.0 mL | MeOH in binding buffer |
| `bindTeabStock` | 1.0 M | TEAB stock for binding buffer |
| `bindTeabFinal` | 100.0 mM | TEAB final in binding buffer |
| `bindMeohPct` | 90.0 % | MeOH % in binding buffer |
| `trapTubeVol` | 1.5 mL | S-Trap tube size |
| `bindBufferX` | 7.0 × | Binding buffer per sample volume |
| `loadSpinTime` | 30.0 s | Loading spin time |

**Wash × 3**

| key | value | label |
|---|---|---|
| `washSpinTime` | 30.0 s | Wash spin time |
| `washVol` | 150.0 µL | Binding/Wash buffer volume |
| `finalSpinTime` | 1.0 min | Final spin time |

**Trypsin digestion**

| key | value | label |
|---|---|---|
| `trypsinDissolveVol` | 1500.0 µL | Volume to dissolve trypsin |
| `trypsinTeabVol` | 100.0 µL | TEAB volume for trypsin |
| `trypsinTeabConc` | 100.0 mM | TEAB concentration for trypsin |
| `digestProteinAmt` | 100.0 µg | Protein digested |
| `trypsinAmt` | 6.67 µg | Trypsin used |
| `trypsinVialAmt` | 100.0 µg | Trypsin per vial |
| `trypsinRatio` | 15.0 | Trypsin:protein ratio |
| `digestTemp` | 37.0 °C | Digestion temp |

**Elution**

| key | value | label |
|---|---|---|
| `elute1SpinTime` | 1.0 min | Elution 1 spin time |
| `elute1Vol` | 100.0 µL | Elution 1 volume (TEAB) |
| `elute1Conc` | 50.0 mM | Elution 1 TEAB concentration |
| `elute2SpinTime` | 1.0 min | Elution 2 spin time |
| `elute2Vol` | 100.0 µL | Elution 2 volume (formic acid) |
| `elute2Pct` | 0.15 % | Formic acid % |
| `elute3SpinTime` | 1.0 min | Elution 3 spin time |
| `elute3Vol` | 100.0 µL | Elution 3 volume (ACN) |
| `elute3Pct` | 50.0 % | ACN % |
| `submitAmt` | 30.0 µg | Peptide submitted |

## DIA-NN — Data-Independent Acquisition  (`diann`)

_No numeric parameters — reference protocol._

## Perseus — Statistical Analysis  (`perseus`)

_No numeric parameters — reference protocol._

## MiSeq — Amplicon Sequencing  (`miseq`)

**1 — Design primers**

| key | value | label |
|---|---|---|
| `ampliconLen` | 200.0 bp | Optimal amplicon length |
| `templateLen` | 300.0 bp | Template length for Primer-Blast |
| `primerStockConc` | 100.0 µM | Primer stock concentration |
| `primerWorkConc` | 10.0 µM | Primer working concentration |

**2 — Test PCR (GoTAQ G2, optional)**

| key | value | label |
|---|---|---|
| `gelLoadVol1` | 10.0 µL | Gel load volume (test PCR) |
| `gelPct1` | 1.0 % | Agarose gel % (test PCR) |
| `expectedBandLen` | 267.0 bp | Expected band with tags |
| `ampliconLenNoTag` | 200.0 bp | Amplicon without tags |

**3 — High-fidelity PCR for MiSeq submission**

| key | value | label |
|---|---|---|
| `gelLoadVol2` | 10.0 µL | Gel load volume (full PCR) |
| `gelPct2` | 1.0 % | Agarose gel % (full PCR) |

**4 — Clean up (AMPure XP beads)**

| key | value | label |
|---|---|---|
| `beadVortexTime` | 10.0 s | Bead vortex time |
| `beadBindTime` | 8.0 min | Bead binding time |
| `magnetTime` | 5.0 min | Time on magnet |
| `etohWashTime` | 30.0 s | EtOH wash time |
| `etohVol` | 200.0 µL | EtOH volume |
| `etohPct` | 80.0 % | EtOH % |
| `eluteTime` | 2.0 min | Elution incubation |
| `eluteVol` | 30.0 µL | Elution water volume |

**5 — Submission**

| key | value | label |
|---|---|---|
| `submitConc` | 15.0–25.0 ng/µL | Concentration to submit |
| `submitVol` | 6.0 µL | Volume to submit |

## Retrieve & Annotate Gene Sequences  (`geneseq`)

**3 — Retrieve promoter (EPD)**

| key | value | label |
|---|---|---|
| `tataDistance` | 30.0 bp | TATA box distance upstream |

## Finding & Evaluating Crystal Structures (PDB)  (`pdb`)

_No numeric parameters — reference protocol._

## AlphaFold — Structure Prediction  (`alphafold`)

**3 — AlphaFold3 / ColabFold for custom predictions**

| key | value | label |
|---|---|---|
| `predictTime` | 10.0–30.0 min | AF3 prediction time |

## PyMOL — Getting Started  (`pymol`)

_No numeric parameters — reference protocol._

## PyMOL — Publication-Quality Figures  (`pymolfig`)

_No numeric parameters — reference protocol._

## Binding Site & Pocket Analysis  (`pockets`)

_No numeric parameters — reference protocol._

## Ternary Complex Modelling (PROTAC)  (`ternary`)

_No numeric parameters — reference protocol._

## TR-FRET — Ternary Complex Formation  (`trfret`)

**Principle &amp; key parameters**

| key | value | label |
|---|---|---|
| `ratioScale` | 10000.0 × | Ratio scaling factor |
| `dmsoMaxPct` | 1.0 % | Max DMSO final |
| `dmsoFlatPct` | 1.0 % | DMSO tolerated (flat signal) |
| `dmsoDropPct` | 2.0 % | DMSO where signal drops |

**Reagents &amp; setup**

| key | value | label |
|---|---|---|
| `hepesConc` | 25.0 mM | HEPES |
| `naclConc` | 150.0 mM | NaCl |
| `tcepConc` | 0.5 mM | TCEP |
| `tween20Pct` | 0.05 % | Tween-20 |
| `bsaPct` | 0.1 % | BSA |
| `minPurity` | 90.0 % | Minimum protein purity |
| `reactionVol` | 10.0–20.0 µL | Reaction volume |
| `doseTop` | 10.0 µM | Dose-response top |
| `doseBottom` | 0.1 nM | Dose-response bottom |
| `dmsoStockPct` | 100.0 % | DMSO in compound plate |
| `dmsoAssayPct` | 1.0 % | DMSO in assay |
| `dmsoDilution` | 100.0 | Dilution into assay |

**Optimisation (stepwise, after Lin &amp; Chen, ACS Pharmacol. Transl. Sci. 2021)**

| key | value | label |
|---|---|---|
| `donorAbRange` | 0.25–8.0 nM | Donor antibody titration range |
| `acceptorAbRange` | 0.5–16.0 nM | Acceptor antibody titration range |
| `acceptorAbConc` | 2.0–4.0 nM | Optimal acceptor antibody |
| `donorAbConc` | 2.0 nM | Optimal donor antibody |
| `proteinTitrRange` | 1.0–20.0 nM | Protein titration range |
| `poiConc` | 2.0 nM | Optimal POI concentration |
| `e3Conc` | 8.0 nM | Optimal E3 concentration |
| `incubateTime` | 120.0–180.0 min | Typical incubation time |
| `timeCourseMax` | 300.0 min | Longest time point |
| `dmsoTestMax` | 4.0 % | Top DMSO tested |
| `dmsoStablePct` | 1.0 % | DMSO where assay is stable |

**Protocol — 384-well setup (20 uL)**

| key | value | label |
|---|---|---|
| `hepesConc2` | 25.0 mM | HEPES (LANCE buffer) |
| `naclConc2` | 50.0 mM | NaCl (LANCE buffer) |
| `tcepConc2` | 2.0 mM | TCEP (LANCE buffer) |
| `tween20Pct2` | 0.005 % | Tween-20 (LANCE buffer) |
| `proteinAConc` | 25.0 nM | Alexa647 Protein A |
| `proteinBConc` | 2.5 nM | Biotinylated Protein B |
| `streptavidinConc` | 0.25 nM | LANCE Streptavidin Fluorophore |
| `wellVol` | 20.0 µL | Final volume per well |
| `lanceIncubateTime` | 17.0 hours | LANCE incubation time |

## Fluorescence Polarization (FP)  (`fp`)

**Principle**

| key | value | label |
|---|---|---|
| `mpScale` | 1000.0 × | mP scaling factor |
| `coopPoiX` | 10.0 × | POI excess over KD (cooperativity) |

**VHL FP assay — reagents**

| key | value | label |
|---|---|---|
| `tracerConc` | 5.0–10.0 nM | Tracer concentration |
| `tracerKd` | 5.0–10.0 nM | Tracer KD |
| `vcbConc` | 100.0–200.0 nM | VCB assay concentration |
| `hepesConc` | 25.0 mM | HEPES |
| `naclConc` | 150.0 mM | NaCl |
| `tcepConc` | 0.5 mM | TCEP |
| `tween20Pct` | 0.01 % | Tween-20 |
| `reactionVol` | 20.0–50.0 µL | Reaction volume |

**VHL FP assay protocol**

| key | value | label |
|---|---|---|
| `doseTop` | 100.0–500.0 µM | Top compound concentration |
| `dmsoMaxPct` | 1.0 % | Max DMSO final |
| `preIncubateTime` | 30.0 min | Pre-incubation on ice |
| `vcbMixX` | 2.0 × | VCB mix strength |
| `tracerMixX` | 2.0 × | Tracer mix strength |
| `compoundVol` | 10.0 µL | Compound volume |
| `mixVol` | 10.0 µL | Protein-tracer mix volume |
| `totalVol` | 20.0 µL | Total well volume |
| `incubateTime` | 30.0–60.0 min | Incubation time |
| `directFitX` | 10.0 × | Protein excess for direct fit |

**CRBN FP assay — notes**

| key | value | label |
|---|---|---|
| `crbnTracerConc` | 10.0–50.0 nM | CRBN tracer concentration |
| `crbnConc` | 200.0–500.0 nM | CRBN-DDB1 concentration |
| `pomalidomideKd` | 1.0–5.0 µM | Pomalidomide KD |
| `lenalidomideKd` | 10.0–50.0 µM | Lenalidomide KD |

**Cooperativity by FP**

| key | value | label |
|---|---|---|
| `coopPoiTernaryX` | 10.0 × | POI excess for ternary FP |

## SPR (Biacore) — Binary & Ternary Kinetics  (`spr`)

**SPR assay design — ternary complex**

| key | value | label |
|---|---|---|
| `analyteRange` | 0.1–10.0 × | PROTAC range (× KD) |
| `mckThreshold` | 100.0 nM | KD below which to use MCK |
| `preformTime` | 30.0 min | Pre-incubation time |
| `preformPoiConc` | 10.0 µM | Saturating POI for pre-form |
| `preformProtacConc` | 1.0 µM | PROTAC in pre-form |

**Running buffer &amp; surface prep**

| key | value | label |
|---|---|---|
| `dmsoPct` | 1.0–2.0 % | DMSO for small molecules |
| `hepesConc` | 10.0 mM | HEPES |
| `naclConc` | 150.0 mM | NaCl |
| `tcepConc` | 0.5 mM | TCEP |
| `tween20Pct` | 0.005 % | Tween-20 |
| `dmsoCalRange` | 0.5–3.0 % | DMSO calibration range |
| `regenPulseTime` | 5.0 s | Regeneration pulse time |
| `glycineConc` | 10.0 mM | Glycine for regeneration |
| `naclRegenConc` | 1.0 M | NaCl for regeneration |

**Protocol — binary binding (PROTAC vs. immobilised VCB)**

| key | value | label |
|---|---|---|
| `conditionInjections` | 3.0 × | Chip conditioning injections |
| `captureConc` | 10.0–50.0 nM | VCB-biotin capture concentration |
| `blockTime` | 1.0 min | Blocking injection time |
| `captureFlow` | 5.0 µL | Capture flow rate |
| `blockInjections` | 3.0 × | Blocking injections |
| `doseBottom` | 1.3 nM | Lowest PROTAC concentration |
| `runDmsoPct` | 1.0 % | DMSO in running buffer |
| `assocTime` | 60.0–120.0 s | Association time |
| `dissocTime` | 120.0–300.0 s | Dissociation time |
| `flowRate` | 30.0–100.0 µL | Flow rate |
| `binaryFitModel` | 1.0 | Binding model (binary) |

**Protocol — ternary complex (pre-formed PROTAC:POI vs. VCB)**

| key | value | label |
|---|---|---|
| `ternaryPreformTime` | 30.0 min | Pre-incubation time (ternary) |
| `ternaryPoiConc` | 10.0 µM | Saturating POI (ternary) |
| `ternaryDoseBottom` | 12.0 nM | Lowest PROTAC (ternary) |
| `sckDissocTime` | 600.0–1200.0 s | Final dissociation (SCK) |
| `sckAssocTime` | 100.0 s | Association per concentration (SCK) |
| `ternaryFitModel` | 1.0 | Binding model (ternary) |

**Interpreting results in the degrader context**

| key | value | label |
|---|---|---|
| `mz1Koff` | 0.006 s | MZ1 koff |
| `mz1HalfLife` | 130.0 s | MZ1 ternary complex half-life |
