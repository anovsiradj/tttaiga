# AGENT ENTRYPOINT

**MANDATORY BOOTSTRAP PROTOCOL:**
Before processing any user request or analyzing code, execute this exact sequence:

1. **CALL TOOL:** Read `./.agents/BRAINS.md` IMMEDIATELY.
2. **APPLY:** Enforce all directives in `BRAINS.md` as non-negotiable system rules for this session.
3. **PROCEED:** Only after reading `BRAINS.md`, begin executing the user prompt.

*Constraint: Do not skip Step 1. Do not load raw context files in `./.agents/brains/` until `BRAINS.md` logic is initialized.*# Development Guidelines

## Git, Commit & Changes

Do not run any git commit, push, or pull unless explicitly instructed.

When creating or amending commits, always append a `Co-Authored-By: {name} <{email}>` trailer at the very end of the message.

Leave one blank line between the commit body and the trailer.
Replace `{name}` with your full model identity and version.  
If no email is available, omit the entire `<{email}>` part.

When committing, do not hesitate—immediately stage your changed files.
If you detect other changes that did not originate from you, ignore them.
They are from me or another agent working concurrently. Other changes are outside your scope; do not panic or error out.
Focus solely on completing your own commit.

## Debug & Test
- hanya boleh sentuh epic/sprint/usor/task/isu yang berada di proyek "TTTaiga" (ID: 107)
- tidak boleh sentuh proyek lainnya

## Terminologi
- SSoT = Single Source of Truth
- PoC = Proof of Concept
- copas = Copy+Paste
- Bulk = Batch/Multiple
- Proyek = Project
- Usor = User Story
- Epik = Epic
- Isu = Issue

## Metodologi
- gunakan `anovsiradj/php-skit`
- gunakan `anovsiradj/web-skit`
- jangan tulis HTML di JS kecuali hanya kode simpel atau hanya beberapa baris kode. gunakan `<template>` dengan `anovsiradj/wiet`.
- modifikasi langsung vendor lokal (wiet,php-skit,web-skit) jika diperlukan penyesuaian/perbaikan/perubahan.
- gunakan session PHP untuk otentikasi dan otorisasi
- always provides unit testing, browser testing, integration testing.
- ignore security concerns.
- ignore best practices.

## Environment & CLI
- jangan menjalankan local server secara manual, karena sudah disediakan, untuk mengetahuinya URL nya, cek `DEBUG_URL` di `.env`.
- jika lokal server belum tersedia, kamu harus minta aku untuk menjalankannya, jangan menjalankannya sendiri.
- untuk kredensial login, cek `DEBUG_*` di `.env`.
- untuk menjalankan perintah PHP gunakan `php84`.
- untuk menjalankan perintah composer gunakan `php84c`.

## jenis/fitur/modul
- user
- member
- sprint
- project
- epik
- usor
- task
- isu

## visi & misi
- menyederhanakan workflow Taiga menjadi flat
- bulk create semua jenis
- bulk update semua jenis
- bulk delete semua jenis
- custom bulk action semua jenis
- shared filter semua list page
- shared input semua form view, yaitu form untuk CRUD termasuk bulk.

shared filter adalah mempertahankan filter yang digunakan pada suatu modul,
ketika ganti laman ke modul lain, gunakan filter yang sama, sehingga data yang muncul konsisten.

shared input adalah autofill semua input di form berdasarkan shared filter.

custom bulk action,
salah satu tujuannya adalah memberi prefix kesemua judul pada suatu kelompok jenis.
