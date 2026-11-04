/**
 * KRC Gem Tracker - Apps Script for the "KRC Gem Tracker" Google Sheet.  (version 6.3)
 * Paste into Extensions > Apps Script (replace everything in Code.gs), Save, then
 * Deploy > Manage deployments > (pencil) Edit > Version: New version > Deploy  (keeps the same /exec URL).
 *
 * GET  ?action=summary  -> {ok, kids:[{id,name,group,tier,earned,spent,left,level,title}]}
 * POST (text/plain JSON) {type:'gem', sessionDate:'2026-11-01', name, group, orange, green, blue, red, diamond, xp, leader, clientId}
 *                        {type:'purchase', date, name, group, points, note, leader, clientId}
 *                        {type:'addkid', name, group, leader, clientId}          // FIX (v6.3) new
 *
 * FIX (v6.3) summary of changes:
 *  - NEW 'addkid': adds a row to the Kids tab (next id like P07/G15), and makes sure the Summary
 *    and Door tabs have formula rows for it. Before this, an add-kid request fell through to the
 *    "else" below and would have written an empty GemLog row instead.
 *  - Unknown types are now refused (no more accidental GemLog rows).
 *  - Duplicate protection is now permanent: the clientId is written in a "ClientId" column
 *    (GemLog column N, Purchases column H, Kids column F) and checked before adding. The old
 *    CacheService check only remembered for 6 hours.
 */
var SECRET = ''; // KEEP YOUR OWN SECRET WORD HERE (copy it from your current script before pasting!) - must match the Key in the app settings

var GROUP_PREFIX = { Pebbles: 'P', Granites: 'G', Quartz: 'Q', Diamonds: 'D' };   // FIX (v6.3)
var GROUP_TIER = { Pebbles: 1, Granites: 2, Quartz: 3, Diamonds: 4 };             // FIX (v6.3) matches the app

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (SECRET && (e.parameter.key || '') !== SECRET) return json_({ok:false, error:'bad key'});
  var sh = SpreadsheetApp.getActive().getSheetByName('Summary');
  var v = sh.getDataRange().getValues();
  var kids = [];
  for (var i = 1; i < v.length; i++) {
    if (!v[i][1]) continue;
    kids.push({id:v[i][0], name:v[i][1], group:v[i][2], tier:v[i][3], earned:v[i][4], spent:v[i][5],
               left:v[i][6], level:v[i][7], title:v[i][8]});
  }
  return json_({ok:true, kids:kids, updated:new Date().toISOString()});
}

function kidId_(name, group) {
  var v = SpreadsheetApp.getActive().getSheetByName('Kids').getDataRange().getValues();
  for (var i = 1; i < v.length; i++) if (v[i][1] == name && v[i][2] == group) return v[i][0];
  return '';
}

function toDate_(s) {
  if (!s) { var d = new Date(); d.setHours(0,0,0,0); return d; }
  var p = String(s).split('-'); return new Date(+p[0], +p[1]-1, +p[2]);
}

// FIX (v6.3): true if this clientId is already in column col of sheet sh (permanent duplicate check).
// Also puts a "ClientId" header in that column if it's empty.
function seen_(sh, col, clientId) {
  if (!sh.getRange(1, col).getValue()) sh.getRange(1, col).setValue('ClientId');
  if (!clientId) return false;
  var last = sh.getLastRow(); if (last < 2) return false;
  return !!sh.getRange(2, col, last - 1, 1).createTextFinder(String(clientId)).matchEntireCell(true).findNext();
}

// FIX (v6.3): copy the last formula row of a tab (Summary/Door) down until it covers row `row`.
// The formulas use relative references (Kids!A52 -> Kids!A53), so copying shifts them automatically.
function extendFormulas_(sh, row) {
  if (!sh) return;
  var last = sh.getLastRow();
  if (last >= row || last < 2) return;
  var src = sh.getRange(last, 1, 1, sh.getLastColumn());
  for (var r = last + 1; r <= row; r++) src.copyTo(sh.getRange(r, 1, 1, sh.getLastColumn()));
}

// FIX (v6.3): add a new kid. Output: {ok, kidId, existed}
function addKid_(ss, b) {
  var name = String(b.name || '').trim(), group = String(b.group || '');
  if (!name || !GROUP_PREFIX[group]) return {ok:false, error:'name and a valid group are needed'};
  var sh = ss.getSheetByName('Kids');
  if (!sh.getRange(1, 6).getValue()) sh.getRange(1, 6).setValue('ClientId');
  var v = sh.getDataRange().getValues();
  var maxN = 0, pre = GROUP_PREFIX[group];
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][1]).toLowerCase() === name.toLowerCase() && v[i][2] == group) return {ok:true, kidId:v[i][0], existed:true};
    var m = String(v[i][0]).match(/^[A-Z](\d+)$/); if (m) maxN = Math.max(maxN, +m[1]);   // numbers are unique across all groups
  }
  var id = pre + (maxN + 1 < 10 ? '0' : '') + (maxN + 1);
  sh.appendRow([id, name, group, GROUP_TIER[group], 'Y', b.clientId || '']);
  var row = sh.getLastRow();
  extendFormulas_(ss.getSheetByName('Summary'), row);
  extendFormulas_(ss.getSheetByName('Door'), row);
  return {ok:true, kidId:id};
}

function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var b = JSON.parse(e.postData.contents);
    if (SECRET && b.key !== SECRET) return json_({ok:false, error:'bad key'});
    var ss = SpreadsheetApp.getActive();
    if (b.clientId) { // de-duplicate retries from the app's offline queue (fast check)
      var cache = CacheService.getScriptCache();
      if (cache.get(b.clientId)) return json_({ok:true, duplicate:true});
    }
    var res;
    if (b.type === 'addkid') {                                   // FIX (v6.3)
      res = addKid_(ss, b);
    } else if (b.type === 'purchase') {
      var ps = ss.getSheetByName('Purchases');
      if (seen_(ps, 8, b.clientId)) return json_({ok:true, duplicate:true});   // FIX (v6.3)
      ps.appendRow([toDate_(b.date), kidId_(b.name, b.group), b.name, b.group, Number(b.points)||0, b.note||'', b.leader||'app', b.clientId||'']);
      res = {ok:true};
    } else if (b.type === 'gem') {                               // FIX (v6.3): was "else" (caught every type)
      var gs = ss.getSheetByName('GemLog');
      if (seen_(gs, 14, b.clientId)) return json_({ok:true, duplicate:true});  // FIX (v6.3)
      gs.appendRow([new Date(), toDate_(b.sessionDate), kidId_(b.name, b.group), b.name, b.group,
        b.orange||0, b.green||0, b.blue||0, b.red||0, b.diamond||0, Number(b.xp)||0, 'app', b.leader||'', b.clientId||'']);
      res = {ok:true};
    } else {
      return json_({ok:false, error:'unknown type ' + b.type});   // FIX (v6.3)
    }
    if (res.ok && b.clientId) CacheService.getScriptCache().put(b.clientId, '1', 21600);  // only after a successful write
    return json_(res);
  } catch (err) {
    return json_({ok:false, error:String(err)});
  } finally { lock.releaseLock(); }
}
