# Diwali ad video

Source of `assets/video/nexcodpos-diwali-ad.mp4` (49.5 s, 1920x1080, Hindi voiceover).
Prices and plan details come from the Diwali launch pricing screen; the dashboard is `dash.png`.

To change something and render again (Python 3 with numpy, scipy, edge-tts; Node with Playwright; ffmpeg):

```
mkdir fonts && for w in Regular Medium SemiBold Bold ExtraBold Black; do curl -fL -o fonts/Poppins-$w.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-$w.ttf; done
curl -fL -o fonts/YatraOne-Regular.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/yatraone/YatraOne-Regular.ttf
mkdir vo3 && python3 tts2.py vo_lines.txt vo3        # voiceover + word timings (hi-IN-MadhurNeural)
for f in vo3/*.mp3; do b=${f%.mp3}; ffmpeg -y -i $f -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=80,equalizer=f=3500:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=3" -ar 48000 -ac 1 ${b}p.wav; done
python3 music.py .                                     # dhol groove + SFX + voice -> mix.wav
python3 -m http.server 8765 &                          # then render 1485 frames at 30 fps
mkdir frames && node render.js http://127.0.0.1:8765/ad.html frames 30 0 1485
ffmpeg -framerate 30 -i frames/f%05d.jpg -i mix.wav -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -af loudnorm=I=-14:TP=-1:LRA=11 -c:a aac -b:a 160k -shortest nexcodpos-diwali-ad.mp4
```

The line timings in `ad.html` (`V`) and `music.py` (`V`) must match; word offsets inside a line
come from the `.json` files `tts2.py` writes. If a voice line changes length, move the later
start times so each line still ends before the next one begins.
