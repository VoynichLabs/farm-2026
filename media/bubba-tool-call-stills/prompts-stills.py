# stills.py: every still for the Tool Call video (script v2, voynich-website docs/2026-10-05-tool-call-video-plan.md),
# built on the cyber Bubba reference so the look stays consistent. Two waves: the second wave uses first-wave results as
# references (the stage-2 switchboard look, the sub-agent copies). Skips stills that already exist.
#   python3 tools/stills.py [name ...]
import os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
S = 'out/stills/'
S1, S3, PLAIN, COOP = S + '11_hero_cyber_b.png', S + '12_loaded_c.png', S + '01_hero.png', S + '10_coop.png'
ID = ("Same man as the reference image: same face, stubble and build, the graphics-card hard hat with RGB fans, copper heat sinks and glowing runes, "
      "the wraparound cybernetic shades with scrolling code, navy work coveralls with the big white oval chest patch reading BUBBA (spelled exactly B-U-B-B-A) in red script. "
      "Freaky digital world: every cable and pipe glows cyan, magenta and acid green with tiny luminous writing running along it, glowing runes float in the haze, "
      "his tools have an iridescent digital sheen with etched glowing runes. Photorealistic, cinematic, vertical frame, 35mm film grain.")
W1 = {   # name: (prompt, refs)
 'c1_phone': ("He stands at an old black rotary wall phone mounted on a server-rack wall, its coiled cord glowing. He holds the receiver to his ear with one hand and has a greasy finger in the rotary dial with the other, about to spin it. A paper work order is clipped to his chest pocket. Medium shot, the rotary dial clearly visible.", [S1]),
 'c2_switch': ("He now also wears a vintage telephone operator's headset over his hard hat and has coils of glowing cable slung over both shoulders. He works an old-fashioned telephone switchboard packed with jacks and small blinking lamps, both hands plugging glowing patch cords, a dozen cords criss-crossing.", [S1]),
 'c5_main': ("He kneels at a giant glowing pipe stenciled MAIN in big letters that runs across the data center floor, beside a newly welded pipe section with a fresh glowing seam, a welding torch in one hand and his other hand gripping a big red valve wheel. He wears the graphics-card backpack and cables over his shoulders.", [S3]),
 'c6_star': ("He is maxed out: graphics-card backpack, cables over both shoulders, an overloaded tool belt, and his hard hat covered in dozens of worn job stickers. A hand reaches in and slaps a shiny gold star sticker onto the front of his hard hat; he beams with a huge grin. Cyber chickens and turkeys around his boots in the data center, a disco ball above.", [S3]),
 'line_hang': ("High up a wooden power pole at dusk in a climbing harness with spikes, he hangs off the pole holding an orange lineman's test phone to his ear, its clip leads attached to a glowing data wire; bored and patient, waiting on hold.", [S1]),
 'shrug': ("Stripped of all his gear: no hard hat, no shades, no tool belt, just plain navy coveralls with the BUBBA patch. He stands empty-handed in a bare grey room, shrugging with his palms up, sheepish.", [PLAIN, S1]),
 'tailgate': ("At the open tailgate of his work truck at night he unrolls a glowing blueprint covered in lines of code, flashlight in one hand, marking it up with a flat carpenter's pencil.", [S3]),
 'tags': ("Close-up on a workbench: two pipe fittings side by side, an old USB cable connector with a red paper tag reading video0 and a new one with a green paper tag reading by-id, his greasy hand holding the new one, his face and patch above.", [S3]),
 'timeclock': ("He punches a paper time card into an old wall-mounted time clock by the shop door, a tired, satisfied grin.", [S3]),
 'read': ("Close-up: he reads a thick dog-eared manual by the beam of a flashlight held in his teeth.", [S1]),
 'write': ("Close-up: he writes on a wooden wall stud with a flat carpenter's pencil, glowing letters appearing where the pencil passes.", [S1]),
 'execute': ("Close medium shot: with his hand gripping a big knife-switch handle on an industrial breaker panel, he throws it down hard; the panel fills the right of frame, whose breakers are labelled with tape: web_search, read_file, bash, edit_file. Sparks fly.", [S1]),
 'web': ("He sweeps a big flashlight through a giant spiderweb made of glowing data cables strung between server racks.", [S1]),
 'dog': ("A cybernetic farm dog with chrome panels and glowing eyes trots toward camera down a data center aisle carrying a printed web page in its mouth; he follows in the background.", [S1]),
 'poll': ("At the very top of a power pole against a night sky he checks a glowing meter box clamped to the pole.", [S1]),
 'log': ("He carries a big wooden log over his shoulder; the log's cut end faces camera and its tree rings glow with tiny lines of timestamped text.", [S3]),
 'glovebox': ("He rummages in his work truck's glovebox, which is overflowing with sticky notes and scraps of paper, a flashlight in his hand.", [S3]),
 'fog': ("Close-up: his cybernetic shades are fogged over and he wipes them with his sleeve; where he has wiped, the glowing readout shows through.", [S3]),
 'ladder': ("Low angle: he climbs a tall ladder in the data center, every rung glowing with a small label.", [S3]),
 'crane': ("On a construction site at night he guides a crane hook lowering a huge glowing block with text inside it onto the top of a stack of glowing blocks.", [S3]),
 'clamp': ("He clamps two thick glowing cable bundles together into one with a big chrome cable clamp, kneeling in the data center.", [S3]),
 'shadow': ("He hangs a pipe wrench on a pegboard shadow board where every tool has a painted outline, and every outline has a small label with a function name such as web_search, read_file, bash.", [S1]),
 'ticket': ("In his shop he tears a long paper work order off a greasy receipt-style ticket printer, reading it with a cocky grin.", [S1]),
 'signoff': ("He holds out a clipboard with a work order toward camera, offering a pen, proud; the paper says WORK ORDER at the top.", [S3]),
 'c4_split': ("In the data center aisle, two glowing translucent copies of him are peeling out of his body, one to his left and one to his right, half overlapping his silhouette like a double exposure. The copies are lighter versions: each copy's hard hat carries only a single graphics card, each has only a small belt; the left copy holds a wifi signal meter with an antenna, the right copy holds a magnifying glass and a logbook; each copy holds a white index card. He has glowing cables over his shoulders and the graphics-card backpack.", [S3]),
 'c0_arrive': ("At dusk at a rustic wooden chicken coop on a farm, glowing wires running along the coop and its wire run, he stands at the coop's corner post looking up at a small dead webcam mounted on the post, its cable dangling; he shines a flashlight up at it; a cybernetic chicken with chrome feathers perches on his shoulder; more cyber chickens peck around his boots. Medium-wide shot, his face and the BUBBA patch clearly visible.", [S1, COOP]),
 'coopcam': ("EMPTY OF PEOPLE: no man, nobody at all in the frame. Security camera view (wide angle, a timestamp in the corner, slight fisheye) of the inside of a rustic wooden chicken coop at night, glowing wires along the walls, several cybernetic chickens with chrome feathers and glowing eyes roosting and pecking. Only chickens, absolutely no person.", [COOP]),
}
W2 = {
 'c3_disco': ("Four copies of him, all with the same face, gear, operator headset and BUBBA patch, on a light-up 1970s disco floor in the middle of the data center under a giant mirror ball, mid disco move, each holding a different tool high: one a big flashlight, one a manila file folder, one a sledgehammer, one a heavy power plug on a cord. Cyber chickens bob at their feet.", [S + 'c2_switch.png']),
 'burst': ("Lying on his back under a sink, a clogged glowing pipe bursts in his face and a spray of glowing characters, curly braces and code blasts out like water; he flinches with a shocked grin. He wears the operator headset and the cables over his shoulders.", [S + 'c2_switch.png']),
 'bits': ("At a workbench he snaps glowing drill bits into an open drill-bit case, each bit glowing with a small label; close on his hands and the case, his face above. Cables over his shoulders.", [S + 'c2_switch.png']),
 'harness': ("Wide shot: he hangs in mid-air, his feet well off the floor, suspended from a single rope by a full-body fall-arrest safety harness clipped to a ceiling rail high above the data center aisle, dangling and spinning slowly with his arms spread wide, grinning, a mirror ball beside him throwing sparkles. Cables over his shoulders.", [S + 'c2_switch.png']),
 'conduct': ("He stands in the data center conducting like an orchestra conductor, a pipe wrench raised as a baton, both arms up; the two lighter glowing copies of himself work at racks in the background.", [S + 'c4_split.png']),
 'copyL': ("One of the lighter glowing copies of him (a single graphics card on the hard hat, a small belt) stands in a rustic chicken coop at night holding up a wifi signal meter with an antenna, reading it; cyber chickens watch.", [S + 'c4_split.png', COOP]),
 'copyR': ("One of the lighter glowing copies of him (a single graphics card on the hard hat, a small belt) reads a thick logbook through a magnifying glass at a server rack.", [S + 'c4_split.png']),
}
def gen(item):
    name, (prompt, refs) = item; out = S + name + '.png'
    if os.path.exists(out): return name + ' (exists)'
    r = subprocess.run(['python3', 'tools/gen.py', 'still', out, prompt + ' ' + ID] + refs, env={**os.environ, 'ASPECT': '9:16'}, capture_output=True, text=True)
    return name + (' ok' if r.returncode == 0 else ' FAILED ' + (r.stdout + r.stderr)[-300:])
only = set(sys.argv[1:])
for wave in (W1, W2):
    items = [(k, v) for k, v in wave.items() if not only or k in only]
    with ThreadPoolExecutor(8) as ex:
        for res in ex.map(gen, items): print(res, flush=True)
