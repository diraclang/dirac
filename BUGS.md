# Known Bugs

## Shell Import Issues

### youtube.di not showing in :subs after import

**Status:** Open  
**Date Reported:** March 17, 2026

**Description:**  
When importing `dirac-stdlib/lib/youtube.di` in the DIRAC shell, the file appears to load (outputs the `<doc>` content), but the subroutines do not appear in the `:subs` list.

**Steps to Reproduce:**
1. Start DIRAC shell: `dirac shell`
2. Import youtube.di: `|import src="../../dirac-stdlib/lib/youtube.di">`
3. List subroutines: `:subs`
4. Observe that `play-youtube`, `play-youtube-music`, and `open-website` are not listed

**Expected Behavior:**  
The three subroutines from youtube.di should appear in the `:subs` output, similar to how other library files (string.di, telegram.di) work.

**Actual Behavior:**  
The `<doc>` tag content is displayed (indicating the file was found and parsed), but subroutines are not registered in the session.

**Notes:**
- Works correctly when running youtube.di as a file: `dirac /tmp/test-youtube.di` shows all subroutines via `<list-subroutines />`
- Other library files (string.di, telegram.di) import successfully in the shell
- youtube.di now has proper `<dirac>` wrapper tags (added March 16, 2026)
- Path requires `../../` prefix in shell context vs `../` in file context

**Workaround:**  
None currently. Use direct file execution instead of shell import for youtube.di functionality.

**Potential Causes:**
- Shell-specific import handling differs from file-mode interpreter
- `<doc>` tag execution might be interfering with subroutine registration in shell context
- Relative path resolution differences between shell and file modes
