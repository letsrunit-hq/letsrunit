import { Controller } from '@letsrunit/controller';
import { makeFeature } from '@letsrunit/gherkin';
import { Journal, NoSink } from '@letsrunit/journal';

interface RunTestOptions {
  headless?: boolean;
  journal?: Journal;
}

export default async function runTest(
  target: string,
  opts: RunTestOptions = {},
): Promise<void> {
  // TODO split target in baseUrl and page.

  const steps: string[] = [
    "Given I'm on the homepage",
    'And all popups are closed',
    'When I click link "Maak je pagina"',
    'Then I should be on page "/create"',
    'When I fill field "Wat is de naam van de baby?" with "Luca"',
    'When I fill field "Wanneer is de baby geboren?" with "30-01-2025"',
    'When I fill field "Wat is jouw/jullie naam?" with "Sanne de Vries"',
    'When I fill field "Wat is jouw e-mailadres?" with "sanne@example.com"',
    'When I fill field "Wat wil je vertellen aan het bezoek?" with "We zijn zo dankbaar en gelukkig om ons kleine wonder met jullie te mogen delen."',
    'When I fill field "Wat zijn de wensen voor kraamcadeautjes? (optioneel)" with "Luiers en zachte dekentjes zijn welkom."',
    'When I fill field "Periode kraambezoek van" with "01-02-2025"',
    'When I fill field "Tot" with "14-02-2025"',
    'When I click button "Pagina aanmaken"',
    'Then I should be on page "/page/:ref"',
  ];

  const journal = opts.journal ?? new Journal(new NoSink());
  const controller = await Controller.launch({ headless: opts.headless, baseURL: target, journal });

  try {
    await controller.run(makeFeature({ name: "Explore", steps }));
  } finally {
    await controller.close();
  }
}

