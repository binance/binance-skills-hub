# Bun Installation Guide

Bun ships as a single, dependency-free executable. Install it with the install script, a package manager, or Docker on macOS, Linux, and Windows.

## Installation

### macOS / Linux

```bash
curl -fsSL https://bun.com/install | bash
```

> **Linux users:** You need the `unzip` package to install Bun (`sudo apt install unzip`).
> We recommend kernel version 5.6 or higher. Use `uname -r` to check your kernel version.

### Windows

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Bun requires Windows 10 version 1809 or later.

### npm

```bash
npm install -g bun
```

### Homebrew (macOS)

```bash
brew install oven-sh/bun/bun
```

### Docker

```bash
docker pull oven/bun
docker run --rm --init --ulimit memlock=-1:-1 oven/bun
```

**Image variants:**

```bash
docker pull oven/bun:debian
docker pull oven/bun:slim
docker pull oven/bun:distroless
docker pull oven/bun:alpine
```

## Verify Installation

Open a new terminal window and run:

```bash
bun --version
# Output: 1.x.y

# See the precise commit of oven-sh/bun that you're using
bun --revision
# Output: 1.x.y+b7982ac13189
```

## Add Bun to PATH (if not recognized)

If you see a `command not found` error after installation, add `~/.bun/bin` to your `PATH`.

1. Determine your shell:

   ```bash
   echo $SHELL
   # /bin/zsh  or /bin/bash or /bin/fish
   ```

2. Open your shell configuration file:
   - bash: `~/.bashrc`
   - zsh: `~/.zshrc`
   - fish: `~/.config/fish/config.fish`

3. Add these lines:

   ```bash
   export BUN_INSTALL="$HOME/.bun"
   export PATH="$BUN_INSTALL/bin:$PATH"
   ```

4. Reload your config:

   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

**Windows:** If `bun --version` is not recognized, run in PowerShell:

```powershell
[System.Environment]::SetEnvironmentVariable(
  "Path",
  [System.Environment]::GetEnvironmentVariable("Path", "User") + ";$env:USERPROFILE\.bun\bin",
  [System.EnvironmentVariableTarget]::User
)
```

Then restart your terminal.

## Upgrading

```bash
bun upgrade
```

- **Homebrew:** `brew upgrade bun`
- **Scoop:** `scoop update bun`

## Canary Builds

```bash
# Upgrade to latest canary
bun upgrade --canary

# Switch back to stable
bun upgrade --stable
```

## Installing a Specific Older Version

```bash
# macOS/Linux
curl -fsSL https://bun.com/install | bash -s "bun-v1.3.3"
```

```powershell
# Windows
iex "& {$(irm https://bun.com/install.ps1)} -Version 1.3.3"
```

## Direct Downloads

Visit the [releases page on GitHub](https://github.com/oven-sh/bun/releases) to download Bun binaries directly.

### Musl Binaries (Alpine Linux / Void Linux)

For distributions without `glibc`, use the musl binary. Bun's install script automatically selects the correct binary for your system.

## CPU Requirements

Bun targets the Nehalem microarchitecture (SSE4.2) and selects AVX2/AVX-512 code paths at runtime when the CPU supports them.

| Platform | Intel Requirement | AMD Requirement |
| -------- | ----------------- | --------------- |
| x64      | Nehalem (SSE4.2)  | Barcelona       |

---

Source: <https://bun.sh/docs/installation>
