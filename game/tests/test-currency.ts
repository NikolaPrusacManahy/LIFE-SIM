// Update 0.10 — EU lives see euros (1 € = 1.12 $). Display only: rules and saves stay in dollars.
import { check, done } from './harness';
import { USD_PER_EUR, moneyFor, toEuros } from '../src/ui/currency';

check('the rate is 1 € = 1.12 $', USD_PER_EUR === 1.12);
check('$400 shows as €357', toEuros('Rent: $400') === 'Rent: €357');
check('thousands separators survive', toEuros('Need $1,200') === 'Need €1,071');
check('signs stay outside', toEuros('+$50 · −$112') === '+€45 · −€100');
check('several amounts in one line', toEuros('Spent $20 of $100') === 'Spent €18 of €89');
check('text without money is untouched', toEuros('Age 23 · 4/12') === 'Age 23 · 4/12');
check('save slots show each life in its own currency', moneyFor(4000, 'eu') === '€3,571' && moneyFor(4000, 'us') === '$4,000');
done();
