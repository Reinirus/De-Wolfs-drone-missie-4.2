# Ontwerp – De Wolf's Drone Missie Academie 4.0

## A. Wat we bouwen
Een afzonderlijke echte WebGL-vliegproef met vrije xyz-positie, perspectiefcamera, dieptebuffer en 3D-constructies. De eerdere foto-simulator en alle A1/A3- en A2-lessen blijven afzonderlijk bereikbaar. WebGL draait zonder CDN-download.

## Eerste bewijsbare missie
1. Opstijgen vanaf H. 2. Door een brugopening met brugdek en pijlers. 3. Rondom een molen met draaiende wieken. 4. Een kerk op afstand observeren. 5. Tussen bomen sturen. 6. Met RTH terugkeren en gecontroleerd landen. Botsen stopt de vlucht. Een top-down landingscamera en groene H-markering helpen.

## Beeldmateriaal
De eigen foto's dienen als herkenbare routekaarten, inspiratie voor materiaal-/kleurkeuze en later textures. Uit één frontale foto kun je de verborgen achterkant of onderzijde niet reconstrueren; daarvoor zijn echte 3D-modellen, handmatige modellering of veel overlappende foto's nodig. De brug, molen, kerk, bomen en woningen in deze eerste proef zijn handgemaakte eenvoudige 3D-meshes, niet exacte digitale kopieën van historische locaties. Geen stock-watermerkfoto's opnemen.

## Techniek
WebGL 1, zelf meegeleverde shaders en geometrie, geen runtime netwerkverbinding. Camera achter drone, FPV en loodrecht beneden. Kijkrichting via pijlen/muis. Botsing met gebouw, boom, pijler, brugdek en grond. RTH is vereenvoudigde oefenautomatisering, geen DJI-flightfysica. Missies zijn fictieve besturingsoefeningen; werkelijk vliegen bij bruggen/kerken/menigten vergt aparte juridische en operationele beoordeling.

## Acceptatiecriteria
- Startpagina opent WebGL-proef, met zichtbare gebouwen en drone (geen foto-oppervlak als wereld).
- Met W/S kan de drone stijgen en dalen, pijltjes bewegen, A/D draaien.
- Brug heeft vrije ruimte onder dek en botsingsvlakken op dek/pijlers.
- Verschillende camerastanden, waaronder 90 graden naar beneden.
- Alle checkpoints bereikbaar, veilige H-landing levert succes; ongecontroleerde aanraking elders is botsing.
- RTH stuurt zichtbaar naar H. Herstart reset positie en punten.
- Duidelijke WebGL-foutmelding als browser WebGL blokkeert.
- Bestaande theorie en fotosimulator blijven toegankelijk.

## Grenzen
Geen fotorealisme, niet exacte plaatsgeometrie, geen officieel examenbewijs. Dit is een technische 3D-vertical slice, niet het einde van het complete project. Volgende fase: gelicenseerde GLB-modellen van locaties, texturen, animaties en volledige device-/leerlingtests.
