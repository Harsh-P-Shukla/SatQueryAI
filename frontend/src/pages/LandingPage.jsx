import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Image as ImageIcon, MessageSquare, Satellite, UploadCloud } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ImageWithFallback } from "../components/ImageWithFallback";

const examples = [
  {
    image: "/display 1.png",
    query: "How many aircraft are visible?",
    result: "Two aircraft are visible near the taxiway.",
  },
  {
    image: "/display 2.png",
    query: "Where is the denser residential area?",
    result: "The left side has a higher building density.",
  },
  {
    image: "/display 3.png",
    query: "Are the aircraft parked?",
    result: "The aircraft appear parked on the apron.",
  },
  {
    image: "/display 4.png",
    query: "Which facilities are present?",
    result: "A tennis court and swimming pool are visible.",
  },
];

const workflow = [
  { icon: UploadCloud, title: "Upload imagery", copy: "Use a local satellite image or a direct image URL." },
  { icon: MessageSquare, title: "Ask naturally", copy: "Run binary, numeric, semantic, or grounding queries." },
  { icon: CheckCircle2, title: "Track answers", copy: "Review generated captions, visual outputs, and reports." },
];

export function LandingPage({ onGetStarted }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050b18] text-white">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
        <div className="absolute -top-20 left-0 h-72 w-full bg-linear-to-r from-[#ff9933]/25 via-cyan-300/20 to-[#138808]/25 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#ff9933] via-white to-[#138808]" />
        <div className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-10 px-5 py-20 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-[#07182d]/80 px-4 py-2 text-sm text-cyan-100">
              <Satellite className="h-4 w-4" />
              Satellite visual question answering for SIH
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] tracking-normal text-white md:text-7xl">
              SatQuery AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              A clean workspace to inspect satellite imagery, ask visual questions,
              ground objects, generate captions, and export findings without jumping
              between tools.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={onGetStarted}
                className="h-12 rounded-lg bg-cyan-300 px-6 text-base font-semibold text-[#07111f] hover:bg-cyan-200"
              >
                Start analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a
                href="#examples"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-6 text-base text-slate-200 transition hover:bg-white/10"
              >
                View examples
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="relative"
          >
            <div className="rounded-lg border border-white/12 bg-white/[0.07] p-3 shadow-2xl shadow-cyan-950/40 backdrop-blur">
              <div className="overflow-hidden rounded-md bg-white">
                <img src="/logo.png" alt="SatQuery AI logo" className="mx-auto aspect-square max-h-[520px] w-full object-contain p-4" />
              </div>
              <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-3">
                {["Image VQA", "Object grounding", "Caption reports"].map((item) => (
                  <div key={item} className="rounded-md bg-white/[0.06] px-3 py-2 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {workflow.map(({ icon: Icon, title, copy }) => (
            <Card key={title} className="rounded-lg border-white/10 bg-white/[0.06] p-6 text-white">
              <Icon className="mb-5 h-7 w-7 text-cyan-300" />
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{copy}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="examples" className="border-t border-white/10 bg-[#07111f] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-sm text-cyan-200">
                <ImageIcon className="h-4 w-4" />
                Example outputs
              </div>
              <h2 className="text-3xl font-semibold md:text-4xl">One image, direct answers.</h2>
            </div>
            <p className="max-w-xl leading-7 text-slate-300">
              These examples show the core SIH value: quick remote-sensing interpretation through plain-language prompts.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {examples.map((example) => (
              <Card key={example.image} className="overflow-hidden rounded-lg border-white/10 bg-[#0d1829] text-white">
                <div className="grid sm:grid-cols-[220px_1fr]">
                  <ImageWithFallback src={example.image} alt={example.query} className="h-56 w-full object-cover sm:h-full" />
                  <div className="space-y-4 p-5">
                    <p className="text-sm text-cyan-200">Query</p>
                    <h3 className="text-lg font-semibold leading-7">{example.query}</h3>
                    <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
                      {example.result}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
