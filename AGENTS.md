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

- Keep Lovable AI Gateway calls in server request handlers and stream OpenAI Responses through the AI SDK so credentials stay private and long answers remain responsive.
- Store POS state in the normalized Supabase `pos_*` tables and save UI changes through `sync_pos_state` so related writes and inventory deductions commit atomically; keep localStorage only for the one-time legacy import.
