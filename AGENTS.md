<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep this app free of AI Gateway and external AI model calls: the sales-inventory assistant was removed at the user's request, so POS features must compute results locally from Supabase data instead of calling a model.
- Store POS state in the normalized Supabase `pos_*` tables and save UI changes through `sync_pos_state` so related writes and inventory deductions commit atomically; keep localStorage only for the one-time legacy import.
