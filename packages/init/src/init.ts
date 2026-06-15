import { intro, log, outro } from '@clack/prompts';
import { detectEnvironment } from './detect.js';
import { formatInitHelp, shouldShowInitHelp, type InitOptions } from './init-options.js';
import { detectAgentIds } from './setup/agents.js';
import { detectAppTarget, ensureLetsrunitIgnoredInVite } from './setup/project-app.js';
import { ensureLetsrunitIgnored } from './setup/cli-ai.js';
import { setupAgentIntegration } from './init/agents.js';
import { setupBaseUrl } from './init/base-url.js';
import { setupCli } from './init/cli.js';
import { setupCucumber } from './init/cucumber.js';
import { setupGithubActions } from './init/github-actions.js';
import { setupMail } from './init/mail.js';
import { setupPlaywright } from './init/playwright.js';
import type { InitContext } from './init/context.js';

const BANNER = String.raw`
        .:::::.                                                                                                         
     .:::::::::::.          ...                                                                      .-:                
   .::::::   ::::::         =+=                 .                                                    -+=.    .          
  .:::           :::        =+=                -+                                                           -+          
  ::::           ::::       =+=    .-=+==:   -=++===   :==+==:    ==  -==  ==:    .==   -=  :=+=-    :==  -=++===       
 .:::.   .:::.   .:::.      =+=   =+=:..=+=  :-++-::  =+-...-++   ++.==-=  ++:    :++   =+.--.:=++   -++  :=++-::       
 .::     :::::     ::.      =+=  -++     =+:  .++     ++-    .    ++-:     ++:    :++   =+=.   .++:  -++   :++          
 .:::.   .:::    .:::.      =+=  =++=====++-  .++     .=+++=-:    ++=      ++:    :++   =+=     ++-  -++   :++          
  ::::           ::::       =+=  =+=          .++         .:-++:  ++-      ++-    =++   =+=     ++-  -++   :++          
  .:::           :::        =+=  .++:    -=:  .++:    -=     =+-  ++-      =+=   ::++   =+=     ++-  -++   :++.     .   
    ::::::   ::::::         =+=   .=+=-=++-    =++++  :++====+=   ++-      .+++=+- ++   =+=     ++-  -++    =++++  :::  
     .:::::::::::.           .       .::.       ..:.    ..::.     ..         .:.   ..    .      ..    ..     .::.       
        .::::..                                                                                                         `;

function showBanner(): void {
  console.log(BANNER);
}

function buildContext(options: InitOptions): InitContext {
  const env = detectEnvironment();
  const detectedAgents = detectAgentIds(env);
  const appTarget = detectAppTarget(env.cwd);
  return { env, options, detectedAgents, appTarget };
}

function showInitHelp(): void {
  console.log(formatInitHelp());
}

export async function init(options: InitOptions = {}): Promise<void> {
  const context = buildContext(options);
  if (shouldShowInitHelp(context.env.isInteractive, options)) {
    showInitHelp();
    return;
  }

  intro('letsrunit init');
  showBanner();

  const ignoreResult = ensureLetsrunitIgnored(context.env.cwd);
  if (ignoreResult !== 'skipped') log.success(`.gitignore ${ignoreResult}`);
  const viteIgnoreResult = ensureLetsrunitIgnoredInVite(context.env.cwd);
  if (viteIgnoreResult === 'updated') log.success('vite config updated');

  await setupPlaywright(context);
  await setupBaseUrl(context);
  await setupCucumber(context);
  await setupCli(context);
  await setupAgentIntegration(context);
  await setupMail(context);
  await setupGithubActions(context);

  outro('All done! Read the docs: https://docs.letsrunit.ai');
}
