type WordmarkProps = {
  className?: string;
  withTrail?: boolean;
};

/**
 * The "vanep." logotype recreated in text, with the optional pixel motion-trail
 * that echoes the brand logo (light-blue squares dissolving to the left).
 */
export function Wordmark({ className = "", withTrail = true }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {withTrail && (
        <span aria-hidden className="mr-2 flex items-end gap-[3px] self-center">
          <span className="animate-pixel block h-1.5 w-1.5 rounded-[1px] bg-brand/40 [animation-delay:0ms]" />
          <span className="animate-pixel block h-2 w-2 rounded-[1px] bg-brand/60 [animation-delay:150ms]" />
          <span className="animate-pixel block h-2.5 w-2.5 rounded-[2px] bg-brand/80 [animation-delay:300ms]" />
        </span>
      )}
      <span className="wordmark leading-none">
        vanep<span className="wordmark-dot">.</span>
      </span>
    </span>
  );
}
