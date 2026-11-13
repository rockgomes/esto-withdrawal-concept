/**
 * How a credit line works, in six short points. The first five follow what
 * ESTO says on its own credit line pages. The last one is this concept.
 */
export default function HowItWorks({ open = false }: { open?: boolean }) {
  return (
    <details className="how" open={open}>
      <summary>How a credit line works</summary>
      <ol>
        <li>
          <strong>You have a limit.</strong> You can use any part of the limit, at any time. You signed one
          contract for the limit.
        </li>
        <li>
          <strong>You pay only for the part in use.</strong> A limit that you do not use costs nothing.
        </li>
        <li>
          <strong>ESTO sends one invoice a month.</strong> The lowest payment is 1/120 of the amount you used,
          plus interest on the amount you still owe. So the lowest payment gets smaller every month.
        </li>
        <li>
          <strong>You can pay more in any month.</strong> Paying more costs nothing extra, and you pay less
          interest.
        </li>
        <li>
          <strong>The money you pay back is free to use again.</strong>
        </li>
        <li>
          <strong>
            New in this concept: you pay at a store from the limit. <span className="nav-badge">NEW</span>
          </strong>{' '}
          Today you can only move money from the limit to a bank account.
        </li>
      </ol>
    </details>
  );
}
