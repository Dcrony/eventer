path = r"src/pages/Home.jsx"
close_div = "</" + "motion>"
close_div = "</" + "div>"
close_app = "</" + "AppPage>"

with open(path, encoding="utf-8") as f:
    c = f.read()

# Fix SkelCard closing (line ~68)
c = c.replace(
    "        <motion className=\"h-3 w-20 bg-gray-100 rounded\" />\n      </motion>\n    </motion>\n  );\n}\n\n// ── Toolbar",
    "        <div className=\"h-3 w-20 bg-gray-100 rounded\" />\n      </div>\n    </motion>\n  );\n}\n\n// ── Toolbar",
)
# Fix typo in above - outer skel card should close with div
c = c.replace(
    "      </motion>\n    </motion>\n  );\n}\n\n// ── Toolbar",
    "      </motion>\n    " + close_div + "\n  );\n}\n\n// ── Toolbar",
)

# Fix Toolbar closing
c = c.replace(
    "      </motion>\n    </motion>\n  );\n}\n\nexport default function Home",
    "      </motion>\n    " + close_div + "\n  );\n}\n\nexport default function Home",
)

# Fix main Home closing - last closing before );
lines = c.split("\n")
for i in range(len(lines) - 1, -1, -1):
    if lines[i].strip() == ");" and i > 0 and "export default function Home" in c:
        # find the component's last </div> before );
        pass

# Simple: replace wrong motion closings
c = c.replace("</motion>", close_div)
# Restore AppPage opening and fix only main close
c = c.replace("    <AppPage>", "    <AppPage>")
# Last occurrence of close_div before end of Home component should be AppPage
idx = c.rfind("    " + close_div + "\n  );\n}")
if idx != -1:
    c = c[:idx] + "    " + close_app + "\n  );\n}" + c[idx + len("    " + close_div + "\n  );\n}") :]

with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("fixed")
