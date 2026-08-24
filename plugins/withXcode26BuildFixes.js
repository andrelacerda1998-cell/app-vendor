/**
 * Config plugin: correções para compilar a app (Expo SDK 52 / RN 0.76) com o
 * Xcode 16/26 (Clang recente). Injeta no post_install do Podfile:
 *
 *  1. fmt: força FMT_USE_CONSTEVAL 0 no header — o Clang do Xcode 26 rejeita
 *     o `consteval` do fmt vendorizado ("call to consteval function ... is not
 *     a constant expression").
 *  2. RCT-Folly precisa de C++17+; alguns pods ficam em C++14 no Xcode 26
 *     (assert "__cplusplus >= 201703L"). Força C++20 em todos os pods.
 *
 * Torna estas correções reproduzíveis a cada `expo prebuild` (o ios/ é gerado).
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "# --- withXcode26BuildFixes ---";

const INJECTION = `
    ${MARKER}
    fmt_base = File.join(__dir__, 'Pods', 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      system('sed', '-i', '', 's/#  define FMT_USE_CONSTEVAL 1/#  define FMT_USE_CONSTEVAL 0/g', fmt_base)
    end
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
      end
    end
`;

module.exports = function withXcode26BuildFixes(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");

      if (contents.includes(MARKER)) return cfg;

      // Injeta antes do `end` que fecha o bloco `post_install do |installer|`.
      const idx = contents.indexOf("post_install do |installer|");
      if (idx === -1) return cfg;

      // Encontra o `\n  end` (indentação de 2 espaços) que fecha o post_install.
      const closing = contents.indexOf("\n  end", idx);
      if (closing === -1) return cfg;

      contents =
        contents.slice(0, closing) + "\n" + INJECTION + contents.slice(closing);
      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
