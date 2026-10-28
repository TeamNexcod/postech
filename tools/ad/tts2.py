import sys, asyncio, json, certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts
async def one(id_, text, outdir):
    c = edge_tts.Communicate(text, "hi-IN-MadhurNeural", rate="+10%", pitch="-2Hz", boundary="WordBoundary")
    words = []
    with open(f"{outdir}/{id_}.mp3", "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append([ch["offset"] / 1e7, ch["duration"] / 1e7, ch["text"]])
    json.dump(words, open(f"{outdir}/{id_}.json", "w"), ensure_ascii=False)
async def main(lines, outdir):
    await asyncio.gather(*[one(i, t, outdir) for i, t in lines])
lines = [l.rstrip("\n").split("|", 1) for l in open(sys.argv[1], encoding="utf-8") if "|" in l]
asyncio.run(main(lines, sys.argv[2]))
