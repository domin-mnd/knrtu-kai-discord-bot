# Контрибуторам

Для старта бота необходим файл `.env` в папке `/src`. Пример environment файла:

```env
DISCORD_TOKEN=дискорд токен бота
OWNERS=айди
```

## Команды

Команды находятся в папке `/src/commands`. Пример содержания файла:

```ts
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
	description: 'Описание команды' // Описание команды
})
export class UserCommand extends Command {
	// Регистрация аппликэйшен команды
	public override registerApplicationCommands(registry: Command.Registry) {

		// Регистрация слэш команды
		registry.registerChatInputCommand({
			name: this.name, // Название команды == название файла
			description: this.description // Описание команды берётся из ApplyOptions
		});
	}

	// Слэш команда
	public async chatInputRun(interaction: Command.ChatInputInteraction) {
		await interaction.reply({
            content: 'Эта замечательная команда работает',
        });
	}
}
```

## Старт

При старте бота используется файл `/src/lib/util.ts`.