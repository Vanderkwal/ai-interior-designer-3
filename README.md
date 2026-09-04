# ANS Converter Pro

Welkom bij de **ANS Converter Pro**! Dit is een slimme applicatie die docenten helpt bij het digitaliseren, valideren en converteren van examenvragen.

## Wat doet deze app?
De ANS Converter Pro maakt gebruik van AI (Google Gemini) om jouw ruwe examenvragen te analyseren. De app doet het volgende:
- **Scant op anti-testwiseness**: Zorgt ervoor dat alle afleiders (foute antwoorden) ongeveer even lang en visueel vergelijkbaar zijn.
- **De-duplicatie**: Controleert of een antwoordoptie niet per ongeluk dubbel voorkomt of identiek is aan het juiste antwoord.
- **Formattering**: Vormt de vragen om naar het strikte 34-koloms CSV importformaat, zodat je de set direct kunt uploaden in de ANS itembank.

## Hoe gebruik je deze app?
Omdat deze app lokaal op je eigen computer draait, dien je de volgende eenmalige stappen uit te voeren:

### 1. Voorbereiding (Installaties)
Zorg ervoor dat je **Node.js** op je computer hebt geïnstalleerd. Je kunt dit gratis downloaden en installeren via [nodejs.org](https://nodejs.org/).

### 2. De applicatie starten
Open je terminal (of command prompt), navigeer naar de map van dit project en voer de volgende commando's uit:

```bash
# Installeer alle benodigde afhankelijkheden
npm install
```

### 3. API Sleutel Instellen
Om de AI functionaliteiten (het nakijken en converteren van de vragen) te gebruiken, heeft de app een **Gemini API Key** nodig.
1. Ga naar [Google AI Studio](https://aistudio.google.com/) en log in met je Google account.
2. Klik op **Get API key** en genereer een nieuwe sleutel.
3. Maak in de hoofdmap van dit project een nieuw bestand aan met de naam `.env.local`.
4. Voeg de volgende regel toe aan dit bestand en vervang `JOUW_API_KEY` met de zojuist gekopieerde code:
   ```env
   GEMINI_API_KEY=JOUW_API_KEY
   ```

### 4. Applicatie Uitvoeren
Nu alles klaarstaat, kun je de app opstarten met het volgende commando:

```bash
npm run dev
```
Open vervolgens de link die in de terminal verschijnt (vaak is dit `http://localhost:3000` of vergelijkbaar) in je webbrowser.

Veel succes met het valideren van de examens!