export function Colophon() {
  return (
    <footer className="border-t border-foreground mt-auto bg-background">
      <div className="container mx-auto px-5 sm:px-8 py-8 grid grid-cols-1 sm:grid-cols-4 gap-6 text-xs text-muted-foreground">
        <div>
          <span className="eyebrow text-foreground/60 block mb-1.5">
            Dinemate
          </span>
          <span>By Sid Subramanian. Powered by Next.js.</span>
        </div>
        <div>
          <span className="eyebrow text-foreground/60 block mb-1.5">
            Source
          </span>
          <a
            href="https://dining.unc.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground hover:text-foreground"
          >
            dining.unc.edu
          </a>
        </div>
        <div>
          <span className="eyebrow text-foreground/60 block mb-1.5">
            Imagery
          </span>
          <span>
            Unsplash · Wikimedia Commons (
            <span className="italic">CC BY-SA</span>)
          </span>
        </div>
        <div>
          <span className="eyebrow text-foreground/60 block mb-1.5">
            Notice
          </span>
          <span>
            Independent project. Not affiliated with the University of North
            Carolina at Chapel Hill.
          </span>
        </div>
      </div>
    </footer>
  );
}
