
# Google Sheets Setup (Automated Mode)

In this version, the system operates **ONLY** based on the "Time" sheet.

## 1. Create the Required Tabs

### Sheet: "Time"
Headers: `Day`, `Starttime`, `Endtime`, `Status`
- **Day**: Sunday, Monday, etc.
- **Starttime/Endtime**: 24h format (e.g., 07:00, 16:30)
- **Status**: `ON` to allow dismissal, `OFF` to pause it.

### Sheet: "Students"
Headers: `id`, `nameEn`, `nameAr`, `grade`, `className`, `status`, `time`

### Sheet: "Settings"
Headers: `ExamMode`, `DismissalActive`, `AutoScheduleEnabled`
- **ExamMode**: ON/OFF
- **DismissalActive**: (This column is now ignored by the app in favor of the Time sheet).
- **AutoScheduleEnabled**: (Should be ON).

### Sheet: "Admins"
Headers: `username`, `password`, `role`

## 2. Apps Script Logic
Ensure your Apps Script `doGet` maps the `Time` sheet data correctly into a JSON object:
```javascript
// Example Mapping for getSettings action
const timeData = timeSheet.getDataRange().getValues();
const days = [];
for(let i=1; i<timeData.length; i++) {
  days.push({
    Day: timeData[i][0],
    Starttime: timeData[i][1],
    Endtime: timeData[i][2],
    Status: timeData[i][3]
  });
}
return ContentService.createTextOutput(JSON.stringify({
  examMode: settingsSheet.getRange(2,1).getValue() === "ON",
  schedule: { days: days }
})).setMimeType(ContentService.MimeType.JSON);
```
