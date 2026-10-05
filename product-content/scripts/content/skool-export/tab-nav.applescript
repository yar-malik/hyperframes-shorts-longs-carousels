on run argv
  set theURL to item 1 of argv
  set newURL to item 2 of argv
  tell application "Google Chrome"
    repeat with w in windows
      repeat with t in tabs of w
        if URL of t starts with theURL then
          set URL of t to newURL
          return "ok"
        end if
      end repeat
    end repeat
  end tell
  return "TAB NOT FOUND"
end run
