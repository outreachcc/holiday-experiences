// node render.js <short> [--probe 1.5,10,20]   (probe: save stills at those seconds instead of a video)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const name = process.argv[2];
const probeArg = process.argv.indexOf('--probe');
const probes = probeArg > 0 ? process.argv[probeArg + 1].split(',').map(Number) : null;
const PRE = { gates: 0, lepers: 6500, loaves: 3600 }[name];
const OUT = '/tmp/claude-0/shorts/out';
const SITE = '/mnt/user-data/uploads/thanksgiving-experience';
fs.mkdirSync(OUT, { recursive: true });
const durs = {};
for (const f of fs.readdirSync(SITE + '/audio/narration')) if (f.endsWith('.mp3'))
  durs[f.slice(0, -4)] = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SITE + '/audio/narration/' + f]).toString();

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('pageerror', e.message));
  p.on('console', m => { if (m.type() === 'error') console.error('console', m.text()); });
  await p.addInitScript({ content: fs.readFileSync('/tmp/claude-0/shorts/vclock.js', 'utf8') + `;window.__DURS=${JSON.stringify(durs)};` });
  await p.goto('http://localhost:8765/shorts.html');
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(n => { window.__start(n); }, name);
  const step = 1000 / 30;
  // off-camera setup
  let t = 0;
  while (t < PRE) { await p.evaluate(ms => __vt.advance(ms), step); t += step; }
  if (PRE) await p.evaluate(n => { window.__continue(n); }, name);
  const vt0 = await p.evaluate(() => __vt.now);

  let ff = null, tmp = path.join(OUT, `${name}.video.tmp.mp4`);
  if (!probes) ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  let frame = 0; const t0 = Date.now();
  for (;;) {
    await p.evaluate(ms => __vt.advance(ms), frame === 0 ? 0.001 : step);
    const sec = frame / 30;
    if (probes) {
      const hit = probes.find(x => Math.abs(x - sec) < 0.5 / 30);
      if (hit !== undefined) await p.screenshot({ path: `${OUT}/${name}-${hit}.jpg`, type: 'jpeg', quality: 85 });
      if (sec > Math.max(...probes)) break;
    } else {
      const jpg = await p.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(jpg)) await new Promise(r => ff.stdin.once('drain', r));
    }
    frame++;
    if (frame % 150 === 0) console.log(`${name}: ${sec.toFixed(1)}s (${((Date.now() - t0) / 1000).toFixed(0)}s elapsed)`);
    if (await p.evaluate(() => window.__done)) break;
  }
  if (probes) { await b.close(); return; }
  ff.stdin.end(); await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  const duration = frame / 30;

  // sound: effects/bells from the offline engine + the narration recordings at their cue times
  const cues = await p.evaluate(() => window.__cues);
  const b64 = await p.evaluate(() => window.__renderAudio());
  const pcm = Buffer.from(b64, 'base64');
  const hdr = Buffer.alloc(44); hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(44100, 24); hdr.writeUInt32LE(44100 * 4, 28);
  hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(`${OUT}/${name}.fx.wav`, Buffer.concat([hdr, pcm]));
  await b.close();

  const args = ['-y', '-loglevel', 'error', '-i', `${OUT}/${name}.fx.wav`];
  cues.forEach(c => args.push('-i', `${SITE}/audio/narration/${c.id}.mp3`));
  let fc = `[0:a]atrim=start=${(vt0 / 1000).toFixed(3)},asetpts=PTS-STARTPTS,volume=1.1[fx];`;
  cues.forEach((c, k) => {
    const d = Math.max(0, Math.round(c.at - vt0));
    fc += `[${k + 1}:a]aresample=44100,aformat=channel_layouts=stereo${c.trim ? `,atrim=end=${c.trim},afade=t=out:st=${(c.trim - 0.12).toFixed(2)}:d=0.12` : ''},adelay=${d}|${d}[n${k}];`;
  });
  fc += `[fx]${cues.map((c, k) => `[n${k}]`).join('')}amix=inputs=${cues.length + 1}:normalize=0,atrim=end=${duration.toFixed(3)},afade=t=out:st=${(duration - 1.2).toFixed(2)}:d=1.2,loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
  args.push('-filter_complex', fc, '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', `${OUT}/${name}.audio.m4a`);
  execFileSync('ffmpeg', args);
  const fin = path.join(OUT, `${name}.tmp.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-i', `${OUT}/${name}.audio.m4a`, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', fin]);
  fs.renameSync(fin, path.join(OUT, `${name}.mp4`));
  console.log(`${name}: done, ${duration.toFixed(1)}s, ${cues.length} lines, took ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})().catch(e => { console.error(e); process.exit(1); });
