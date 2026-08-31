{
  description = "Dev shell for the joao-kalaf portfolio (Vite + React + Playwright e2e)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = {
    self,
    nixpkgs,
  }:
    /*
      Supported systems: x86_64-linux, aarch64-linux, aarch64-darwin.
      x86_64-darwin (Intel Mac) is NOT supported — nixpkgs' Playwright chromium
      build has no binary for it. Apple Silicon Macs (aarch64-darwin) are fine.

      Playwright note: the nixpkgs `playwright` package bundles browser binaries
      matched to its own version (currently 1.61.x, chromium revision 1228).
      The npm `playwright` devDependency in package.json must track a version
      whose browser revisions agree with nixpkgs — i.e. stay on 1.61.x. If a
      `nix flake update` bumps nixpkgs' playwright to a new browser revision and
      `npm run test:e2e` then can't find a browser, realign the npm package to
      the nixpkgs version (`nix eval nixpkgs#playwright.meta.position` → the
      version in that file).
    */
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
      ];
      eachSystem = nixpkgs.lib.genAttrs supportedSystems;
      pkgsFor = system: nixpkgs.legacyPackages.${system};
    in {
      devShells = eachSystem (
        system:
        let pkgs = pkgsFor system;
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_22 # LTS; matches package-lock engines (^20.19.0 || ^22.12.0 || >=24.0.0)
              librsvg # rsvg-convert for `npm run og:image`
            ];

            # Hand the npm `playwright` driver the nix-provided browsers so it
            # never downloads Chromium (and the nix build is already patched to
            # find its own libs — no LD_LIBRARY_PATH needed).
            shellHook = ''
              export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright.browsers}"
            '';
          };
        }
      );
    };
}
