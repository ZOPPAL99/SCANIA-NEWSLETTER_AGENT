import { useEffect, useMemo, useRef, useState } from "react";

type Issue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  location?: string;
};

type ReleaseDraft = {
  title: string;
  kicker: string;
  body: string;
  imageUrl: string;
  assetId: string;
  relativePath: string;
  uploadFilename: string;
  uploadError?: string;
  isUploading?: boolean;
  alt: string;
  linksText: string;
};

type FormState = {
  subject: string;
  preheader: string;
  heroTitle: string;
  edition: string;
  intro: string;
  disclaimer: string;
  publishMode: "preview/local" | "outlook-cid";
  footerText: string;
  footerLinksText: string;
  releases: ReleaseDraft[];
};

type ValidateResponse = {
  ok: boolean;
  issues: Issue[];
  previewHtml?: string;
};

type GenerateResponse = {
  ok: boolean;
  issues: Issue[];
  message?: string;
  publishMode?: "preview/local" | "outlook-cid";
  uploadedAssets?: string[];
  previewUrl?: string;
  files?: Record<string, string>;
};

type SectionId = "briefing" | "policy" | "releases" | "footer";

const DEFAULT_DISCLAIMER =
  "The images presented in this newsletter are from preliminary designs.\nMinor design and other changes can be expected.";

const EMPTY_RELEASE: ReleaseDraft = {
  title: "",
  kicker: "",
  body: "",
  imageUrl: "",
  assetId: "",
  relativePath: "",
  uploadFilename: "",
  alt: "",
  linksText: "",
};

const INITIAL_FORM: FormState = {
  subject: "Welcome to your Digital Dealer update!",
  preheader: "Upcoming releases and progress highlights.",
  heroTitle: "",
  edition: "March 2026",
  intro: "This edition summarizes upcoming product improvements and near-term release plans.",
  disclaimer: DEFAULT_DISCLAIMER,
  publishMode: "preview/local",
  footerText:
    "Add or remove blocks without changing renderer code paths; QA checks run before delivery artifacts are produced.",
  footerLinksText: "Open preview | http://localhost:3333/dist/preview.html",
  releases: [{ ...EMPTY_RELEASE }],
};

const SECTION_ORDER: Array<{
  id: SectionId;
  step: string;
  title: string;
  description: string;
}> = [
  {
    id: "briefing",
    step: "Step 1",
    title: "Header briefing",
    description: "Set the familiar inbox basics first: subject, preheader, edition, and intro.",
  },
  {
    id: "policy",
    step: "Step 2",
    title: "Release section policy",
    description: "Keep shared guidance in one place so every release card follows the same rules.",
  },
  {
    id: "releases",
    step: "Step 3",
    title: "Upcoming releases",
    description: "Build each release in the same sequence: message, media, then links.",
  },
  {
    id: "footer",
    step: "Step 4",
    title: "Footer and navigation links",
    description: "Finish with next steps and clearly labeled destinations.",
  },
];

function parseLinks(raw: string): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [];
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const split = line.split("|").map((entry) => entry.trim());
    if (split.length === 2) {
      links.push({ label: split[0], href: split[1] });
      continue;
    }
    links.push({ label: "", href: line });
  }
  return links;
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function issueFieldKey(issue: Issue): string | null {
  const location = issue.location ?? "";
  const releaseMatch = location.match(/^blocks\[1\]\.items\[(\d+)\]\.(.+)$/);
  if (releaseMatch) {
    const releaseIndex = Number.parseInt(releaseMatch[1], 10);
    const path = releaseMatch[2];
    if (path.startsWith("title")) {
      return `release-${releaseIndex}-title`;
    }
    if (path.startsWith("kicker")) {
      return `release-${releaseIndex}-kicker`;
    }
    if (path.startsWith("body")) {
      return `release-${releaseIndex}-body`;
    }
    if (path.startsWith("media") && path.includes(".alt")) {
      return `release-${releaseIndex}-alt`;
    }
    if (path.startsWith("links") && path.includes(".label")) {
      return `release-${releaseIndex}-linksText`;
    }
    if (path.startsWith("number")) {
      return `release-${releaseIndex}-title`;
    }
  }

  if (location.startsWith("blocks[1].disclaimer")) {
    return "disclaimer";
  }
  if (location.startsWith("blocks[0].title")) {
    return "subject";
  }
  if (location.startsWith("blocks[0].body")) {
    return "intro";
  }
  if (location.startsWith("blocks[2].body")) {
    return "footerText";
  }

  if (issue.code === "FEATURE_SECTION_DISCLAIMER_MISSING") {
    return "disclaimer";
  }
  if (issue.code === "FEATURE_SECTION_TITLE_MISSING") {
    return "subject";
  }
  if (issue.code === "CTA_MISSING" || issue.code === "CTA_TEXT_LENGTH" || issue.code === "CTA_VERB_FIRST") {
    return null;
  }
  return null;
}

function buildNewsletter(state: FormState): Record<string, unknown> {
  const footerLinks = parseLinks(state.footerLinksText);
  const heroTitle = state.heroTitle.trim()
    ? state.heroTitle.trim()
    : state.edition.trim()
      ? `${state.edition.trim()} highlights`
      : "Edition highlights";
  const releaseItems = state.releases.map((release, index) => ({
    number: index + 1,
    title: release.title,
    kicker: release.kicker,
    body: release.body,
    media: (release.relativePath || release.imageUrl)
      ? [
          {
            src: release.relativePath || release.imageUrl,
            alt: release.alt || "",
            assetId: release.assetId || undefined,
          },
        ]
      : undefined,
    links: parseLinks(release.linksText),
  }));

  const footerLinksText = footerLinks.length
    ? `\nLinks: ${footerLinks.map((link) => `${link.label} (${link.href})`).join(", ")}`
    : "";

  return {
    subject: state.subject,
    preheader:
      state.preheader.trim() ||
      `${state.edition || "Latest"} edition: Upcoming releases and progress highlights.`,
    meta: { language: "en", audience: "general" },
    blocks: [
      {
        type: "hero",
        title: heroTitle,
        body: `${state.intro.trim()}${state.edition.trim() ? `\nEdition: ${state.edition.trim()}` : ""}`,
        ctas: [
          {
            label: "Open briefing",
            href: "https://example.com/briefing",
          },
        ],
      },
      {
        type: "featureSection",
        title: "Upcoming releases",
        disclaimer: state.disclaimer,
        items: releaseItems,
      },
      {
        type: "footer",
        body: `${state.footerText}${footerLinksText}`,
      },
    ],
  };
}

export function App(): JSX.Element {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [qa, setQa] = useState<ValidateResponse>({ ok: false, issues: [] });
  const [validating, setValidating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [generateResult, setGenerateResult] = useState<GenerateResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>(
    {},
  );

  const payload = useMemo(() => buildNewsletter(form), [form]);
  const payloadText = useMemo(() => JSON.stringify(payload), [payload]);
  const introWords = wordCount(form.intro);
  const releaseCount = form.releases.length;
  const errorCount = qa.issues.filter((issue) => issue.severity === "error").length;
  const warningCount = qa.issues.filter((issue) => issue.severity === "warning").length;
  const requiredCount = useMemo(() => {
    let done = 0;
    if (form.subject.trim()) {
      done += 1;
    }
    if (form.intro.trim()) {
      done += 1;
    }
    for (const release of form.releases) {
      if (release.title.trim()) {
        done += 1;
      }
      if (release.kicker.trim()) {
        done += 1;
      }
      if (release.body.trim()) {
        done += 1;
      }
    }
    return done;
  }, [form]);
  const requiredTotal = 2 + form.releases.length * 3;
  const releaseSummaries = useMemo(
    () =>
      form.releases.map((release) => {
        const fields = [
          release.title,
          release.kicker,
          release.body,
          release.alt,
          release.linksText,
        ];
        const filled = fields.filter((value) => value.trim()).length;
        return {
          filled,
          total: fields.length,
          hasMedia: Boolean(release.relativePath.trim() || release.imageUrl.trim()),
          words: wordCount(release.body),
        };
      }),
    [form.releases],
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      setValidating(true);
      try {
        const response = await fetch("http://localhost:3333/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payloadText,
        });
        const data = (await response.json()) as ValidateResponse;
        setQa({ ok: data.ok, issues: data.issues ?? [] });
        if (data.previewHtml) {
          setPreviewHtml(data.previewHtml);
        }
      } catch {
        setQa({
          ok: false,
          issues: [
            {
              severity: "error",
              code: "API_UNREACHABLE",
              message: "Could not connect to http://localhost:3333/api/validate.",
            },
          ],
        });
      } finally {
        setValidating(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [payloadText]);

  async function onGenerate(): Promise<void> {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const response = await fetch("http://localhost:3333/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newsletter: payload,
          publishMode: form.publishMode,
        }),
      });
      const data = (await response.json()) as GenerateResponse;
      setGenerateResult(data);
    } catch {
      setGenerateResult({
        ok: false,
        issues: [
          {
            severity: "error",
            code: "API_UNREACHABLE",
            message: "Could not connect to http://localhost:3333/api/generate.",
          },
        ],
      });
    } finally {
      setGenerating(false);
    }
  }

  function updateRelease(
    index: number,
    field: keyof ReleaseDraft,
    value: string,
  ): void {
    setForm((current) => {
      const releases = [...current.releases];
      releases[index] = { ...releases[index], [field]: value };
      return { ...current, releases };
    });
  }

  async function uploadReleaseImage(index: number, file: File): Promise<void> {
    setForm((current) => {
      const releases = [...current.releases];
      releases[index] = {
        ...releases[index],
        isUploading: true,
        uploadError: "",
      };
      return { ...current, releases };
    });

    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("http://localhost:3333/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        assetId?: string;
        filename?: string;
        relativePath?: string;
        message?: string;
      };

      if (!response.ok || !data.ok || !data.relativePath || !data.assetId) {
        throw new Error(data.message || "Upload failed.");
      }

      setForm((current) => {
        const releases = [...current.releases];
        releases[index] = {
          ...releases[index],
          isUploading: false,
          uploadError: "",
          assetId: data.assetId ?? "",
          relativePath: data.relativePath ?? "",
          uploadFilename: data.filename ?? "",
          imageUrl: data.relativePath ?? releases[index].imageUrl,
        };
        return { ...current, releases };
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setForm((current) => {
        const releases = [...current.releases];
        releases[index] = {
          ...releases[index],
          isUploading: false,
          uploadError: message,
        };
        return { ...current, releases };
      });
    }
  }

  function removeRelease(index: number): void {
    setForm((current) => {
      if (current.releases.length <= 1) {
        return current;
      }
      return {
        ...current,
        releases: current.releases.filter(
          (_entry, currentIndex) => currentIndex !== index,
        ),
      };
    });
  }

  function registerField(key: string) {
    return (element: HTMLInputElement | HTMLTextAreaElement | null): void => {
      fieldRefs.current[key] = element;
    };
  }

  function focusIssue(issue: Issue): void {
    const key = issueFieldKey(issue);
    if (!key) {
      return;
    }
    const target = fieldRefs.current[key];
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus();
  }

  return (
    <main className="shell">
      <header className="regal-hero">
        <div className="hero-stripe" />
        <div className="hero-main">
          <p className="brand-tag">SCANIA EDITORIAL STUDIO</p>
          <h1>Newsletter Command Deck</h1>
          <p className="hero-copy">
            Author, validate, and publish local artifacts with deterministic rendering.
          </p>
        </div>
        <aside className="hero-stat">
          <p>Completion</p>
          <strong>
            {requiredCount} / {requiredTotal}
          </strong>
          <span>{releaseCount} releases configured</span>
        </aside>
      </header>

      <section className="command-bar" aria-label="Editor progress and navigation">
        <div className="command-summary">
          <div className="summary-chip">
            <span className="summary-label">QA</span>
            <strong>{qa.ok ? "Ready" : "Needs fixes"}</strong>
          </div>
          <div className="summary-chip">
            <span className="summary-label">Errors</span>
            <strong>{errorCount}</strong>
          </div>
          <div className="summary-chip">
            <span className="summary-label">Warnings</span>
            <strong>{warningCount}</strong>
          </div>
          <div className="summary-chip">
            <span className="summary-label">Mode</span>
            <strong>{form.publishMode}</strong>
          </div>
        </div>
        <nav className="step-nav" aria-label="Step navigation">
          {SECTION_ORDER.map((section) => (
            <a key={section.id} className="step-link" href={`#${section.id}`}>
              <span>{section.step}</span>
              <strong>{section.title}</strong>
            </a>
          ))}
        </nav>
      </section>

      <section className="workspace">
        <div className="composer">
          <article id="briefing" className="stage">
            <header>
              <p className="stage-kicker">Step 1</p>
              <h2>Header briefing</h2>
              <p className="stage-summary">{SECTION_ORDER[0].description}</p>
            </header>
            <div className="stage-intro">
              <div className="mini-card">
                <span className="mini-label">Inbox clarity</span>
                <strong>One subject, one preheader, one promise</strong>
              </div>
              <div className="mini-card">
                <span className="mini-label">Intro length</span>
                <strong>{introWords} words</strong>
              </div>
            </div>
            <div className="grid two">
              <label>
                Subject *
                <input
                  ref={registerField("subject")}
                  className={!form.subject.trim() ? "invalid" : ""}
                  value={form.subject}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, subject: event.target.value }))
                  }
                />
                <p className="hint">Lead with a clear action or outcome.</p>
              </label>
              <label>
                Hero title (optional)
                <input
                  ref={registerField("heroTitle")}
                  value={form.heroTitle}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, heroTitle: event.target.value }))
                  }
                />
                <p className="hint">
                  If empty, defaults to <code>&lt;Edition&gt; highlights</code>.
                </p>
              </label>
            </div>
            <div className="grid two">
              <label>
                Preheader
                <input
                  ref={registerField("preheader")}
                  value={form.preheader}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, preheader: event.target.value }))
                  }
                />
                <p className="hint">Keep this under 90 characters for inbox clarity.</p>
              </label>
            </div>
            <div className="grid two">
              <label>
                Publish mode
                <select
                  value={form.publishMode}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      publishMode: event.target.value as FormState["publishMode"],
                    }))
                  }
                >
                  <option value="preview/local">preview/local</option>
                  <option value="outlook-cid">outlook-cid</option>
                </select>
                <p className="hint">
                  `outlook-cid` is TODO for MVP. Use `preview/local` for asset rendering.
                </p>
              </label>
              <label>
                Edition
                <input
                  ref={registerField("edition")}
                  value={form.edition}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, edition: event.target.value }))
                  }
                />
                <p className="hint">Example: March 2026.</p>
              </label>
            </div>
            <div className="grid">
              <label>
                Intro *
                <textarea
                  ref={registerField("intro")}
                  className={!form.intro.trim() ? "invalid" : ""}
                  value={form.intro}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, intro: event.target.value }))
                  }
                />
                <p className="hint">
                  Target 20-40 words. Current: {introWords} words.
                </p>
              </label>
            </div>
          </article>

          <article id="policy" className="stage">
            <header>
              <p className="stage-kicker">Step 2</p>
              <h2>Release section policy</h2>
              <p className="stage-summary">{SECTION_ORDER[1].description}</p>
            </header>
            <div className="stage-intro">
              <div className="mini-card">
                <span className="mini-label">Shared rule</span>
                <strong>One reusable disclaimer for every release</strong>
              </div>
            </div>
            <label>
              Disclaimer
              <textarea
                ref={registerField("disclaimer")}
                value={form.disclaimer}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, disclaimer: event.target.value }))
                }
              />
              <p className="hint">Displayed above release cards in all channels.</p>
            </label>
          </article>

          <article id="releases" className="stage">
            <header className="release-top">
              <div>
                <p className="stage-kicker">Step 3</p>
                <h2>Upcoming releases</h2>
                <p className="stage-summary">{SECTION_ORDER[2].description}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) =>
                    prev.releases.length >= 6
                      ? prev
                      : { ...prev, releases: [...prev.releases, { ...EMPTY_RELEASE }] },
                  )
                }
                disabled={form.releases.length >= 6}
              >
                Add release
              </button>
            </header>
            <div className="release-overview">
              <div className="mini-card">
                <span className="mini-label">Recommended count</span>
                <strong>1 to 3 release cards</strong>
              </div>
              <div className="mini-card">
                <span className="mini-label">Configured</span>
                <strong>{releaseCount} cards</strong>
              </div>
            </div>

            {form.releases.map((release, index) => (
              <article className="release-card" key={index}>
                <header className="release-headline">
                  <div>
                    <h3>Release {index + 1}</h3>
                    <p className="release-meta">
                      {releaseSummaries[index].filled} of {releaseSummaries[index].total} key
                      fields filled
                      {releaseSummaries[index].hasMedia ? " | media attached" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => removeRelease(index)}
                    disabled={form.releases.length <= 1}
                  >
                    Remove
                  </button>
                </header>
                <section className="release-group">
                  <div className="group-heading">
                    <h4>Message</h4>
                    <p>Lead with the release name, promise, and short explanation.</p>
                  </div>
                <div className="grid two">
                  <label>
                    Title
                    <input
                      ref={registerField(`release-${index}-title`)}
                      className={!release.title.trim() ? "invalid" : ""}
                      value={release.title}
                      onChange={(event) =>
                        updateRelease(index, "title", event.target.value)
                      }
                    />
                    <p className="hint">Name the capability, not the internal project.</p>
                  </label>
                  <label>
                    Kicker
                    <input
                      ref={registerField(`release-${index}-kicker`)}
                      className={!release.kicker.trim() ? "invalid" : ""}
                      value={release.kicker}
                      onChange={(event) =>
                        updateRelease(index, "kicker", event.target.value)
                      }
                    />
                    <p className="hint">One short promise line.</p>
                  </label>
                </div>
                <label>
                  Body
                  <textarea
                    ref={registerField(`release-${index}-body`)}
                    className={!release.body.trim() ? "invalid" : ""}
                    value={release.body}
                    onChange={(event) => updateRelease(index, "body", event.target.value)}
                  />
                  <p className="hint">
                    Keep it scannable: 1-2 sentences, under 36 words. Current:{" "}
                    {wordCount(release.body)} words.
                  </p>
                </label>
                </section>
                <section className="release-group">
                  <div className="group-heading">
                    <h4>Media</h4>
                    <p>Use one image path and a meaningful alt description when media is present.</p>
                  </div>
                <div className="grid two">
                  <label>
                    Image URL
                    <input
                      ref={registerField(`release-${index}-imageUrl`)}
                      value={release.imageUrl}
                      onChange={(event) =>
                        updateRelease(index, "imageUrl", event.target.value)
                      }
                    />
                    <p className="hint">
                      Use absolute URL or uploaded <code>assets/&lt;filename&gt;</code> path.
                    </p>
                  </label>
                  <label>
                    Upload image (png/jpg)
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void uploadReleaseImage(index, file);
                        }
                      }}
                    />
                    <p className="hint">
                      {release.isUploading
                        ? "Uploading..."
                        : release.uploadFilename
                          ? `Uploaded: ${release.uploadFilename}`
                          : "Upload to /api/upload and store local relative path."}
                    </p>
                    {release.uploadError ? (
                      <p className="error">{release.uploadError}</p>
                    ) : null}
                  </label>
                </div>
                <div className="grid two">
                  <label>
                    Alt text
                    <input
                      ref={registerField(`release-${index}-alt`)}
                      className={
                        (release.relativePath.trim() || release.imageUrl.trim()) &&
                        !release.alt.trim()
                          ? "invalid"
                          : ""
                      }
                      value={release.alt}
                      onChange={(event) => updateRelease(index, "alt", event.target.value)}
                    />
                    <p className="hint">Editable field. Leave empty for now if unknown.</p>
                  </label>
                  <label>
                    Asset path
                    <input value={release.relativePath} readOnly />
                    <p className="hint">Saved in media.src for local preview mode.</p>
                  </label>
                </div>
                </section>
                <section className="release-group">
                  <div className="group-heading">
                    <h4>Links</h4>
                    <p>Keep choices limited to the most important next action for the reader.</p>
                  </div>
                <label>
                  Links (one per line: Label | URL)
                  <textarea
                    ref={registerField(`release-${index}-linksText`)}
                    value={release.linksText}
                    onChange={(event) =>
                      updateRelease(index, "linksText", event.target.value)
                    }
                  />
                  <p className="hint">Use explicit labels, e.g. Read release notes | https://...</p>
                </label>
                </section>
              </article>
            ))}
          </article>

          <article id="footer" className="stage">
            <header>
              <p className="stage-kicker">Step 4</p>
              <h2>Footer and navigation links</h2>
              <p className="stage-summary">{SECTION_ORDER[3].description}</p>
            </header>
            <div className="stage-intro">
              <div className="mini-card">
                <span className="mini-label">Link rule</span>
                <strong>Every destination needs visible text</strong>
              </div>
            </div>
            <div className="grid two">
              <label>
                Footer text
                <textarea
                  ref={registerField("footerText")}
                  value={form.footerText}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, footerText: event.target.value }))
                  }
                />
                <p className="hint">Close with practical next steps for readers.</p>
              </label>
              <label>
                Footer links (one per line: Label | URL)
                <textarea
                  ref={registerField("footerLinksText")}
                  value={form.footerLinksText}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, footerLinksText: event.target.value }))
                  }
                />
                <p className="hint">Avoid raw URLs without labels.</p>
              </label>
            </div>
          </article>
        </div>

        <aside className="cockpit">
          <section className="status-panel">
            <header>
              <p className="stage-kicker">Live QA</p>
              <h2>{validating ? "Checking..." : "Validation status"}</h2>
              <p className="stage-summary">
                Review issues in one place, then jump directly to the affected field.
              </p>
            </header>
            <div className="qa-banner">
              <p className={qa.ok ? "ok" : "error"}>
                {qa.ok ? "PASS" : "FAIL"} - {qa.issues.length} issue(s)
              </p>
              <button type="button" onClick={onGenerate} disabled={generating}>
                {generating ? "Generating..." : "Generate artifacts"}
              </button>
            </div>
            <ul className="issues">
              {qa.issues.map((issue, index) => (
                <li key={`${issue.code}-${index}`} className={issue.severity}>
                  <div className="issue-row">
                    <span>
                      <strong>{issue.code}</strong>: {issue.message}
                      {issue.location ? <span> ({issue.location})</span> : null}
                    </span>
                    {issueFieldKey(issue) ? (
                      <button
                        type="button"
                        className="ghost quick-fix"
                        onClick={() => focusIssue(issue)}
                      >
                        Quick fix
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {qa.issues.length === 0 ? (
              <p className="hint">No issues detected. Safe to generate artifacts.</p>
            ) : null}
            {generateResult ? (
              <p className={generateResult.ok ? "ok" : "error"}>
                {generateResult.ok ? "Artifacts written to ./dist." : "Generate failed."}
                {generateResult.message ? ` ${generateResult.message}` : ""}
                {generateResult.previewUrl ? (
                  <>
                    {" "}
                    <a href={generateResult.previewUrl} target="_blank" rel="noreferrer">
                      Open preview.html
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
          </section>

          <section className="preview-panel">
            <header>
              <p className="stage-kicker">Renderer output</p>
              <h2>Preview</h2>
            </header>
            <iframe className="preview" srcDoc={previewHtml} title="Newsletter Preview" />
          </section>
        </aside>
      </section>
    </main>
  );
}
