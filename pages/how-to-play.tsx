import { Baloo_2, Luckiest_Guy, Macondo } from 'next/font/google'
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

const baloo = Baloo_2({ subsets: ['latin'] })
const lucky = Luckiest_Guy({ subsets: ['latin'], weight: "400" })
const macondo = Macondo({ weight: "400", subsets: ['latin'] });

export default function HowToPlay() {
    return (
        <>
            <Head>
                <title>Pathword - How to play</title>
                <meta name="description" content="Enter the correct password game" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <main className={baloo.className}>
                <h1 className={`text-center text-4xl mt-12 ${lucky.className}`}>Pathword</h1>
                <p className={`mt-5 text-3xl text-center ${macondo.className}`}>How to play</p>
                <div className={`max-w-3xl m-auto mt-6`}>
                    <ol className="list-decimal leading-8">
                        <li>On the main page, enter the game ID provided by the game host.</li>
                        <li>You will be prompted for a player name. This is the player name you will be using for this game</li>
                        <li>Once you enter the game, you will have a choice of which team to join. Preferably the trivia skills of the members of each team are equal, to make the game more challenging.
                            <div className="text-center"><img width="691" height="519" src="/images/GamePlay1.png" alt="GamePlay1" className="max-w-full inline-block border border-gray-600 shadow-lg" /></div>
                        </li>
                        <li>When all players have joined teams, the game host will start the game.</li>
                        <li>Each player will be given a choice of which path to choose. The harder the path, the harder the puzzle. You should discuss amongst your team on which team member should take which path.
                            <div className="text-center"><img width="1031" height="590" src="/images/GamePlay2.png" alt="GamePlay1" className="max-w-full inline-block border border-gray-600 shadow-lg" /></div>
                        </li>
                        <li>Taking multiple paths simultaneously in your team is the most efficient way to win!</li>
                        <li>Don&apos;t worry if you get stuck on a path, there is always an option to go back and take a different path.</li>
                        <li>Each stage in the path contains a puzzle. It may or may not contain a clue; these clues are needed to help you solve the final password. You may guess the answer to the puzzle as many times as it takes.
                            <div className="text-center"><img width="861" height="399" src="/images/GamePlay3.png" alt="GamePlay1" className="max-w-full inline-block border border-gray-600 shadow-lg" /></div>
                        </li>
                        <li>Some puzzles require you to solve them before you can advance further.</li>
                        <li>Once any team member solves a particular puzzle, that pathway is then cleared.</li>
                        <li>At the end of the pathway, you will reach a door that requires a password. All the clues you collected so far would be helpful in guessing the password!
                            <div className="text-center"><img width="1137" height="650" src="/images/GamePlay4.png" alt="GamePlay1" className="max-w-full inline-block border border-gray-600 shadow-lg" /></div>
                        </li>
                        <li>Unlike the other puzzles, however, each team member is given only <strong className="text-bold">one</strong> chance at guessing the password.</li>
                        <li>Guessing the correct password ends the game. All players will be brought to the results screen shortly after.
                            <div className="text-center"><img width="819" height="332" src="/images/GamePlay5.png" alt="GamePlay1" className="max-w-full inline-block border border-gray-600 shadow-lg" /></div>
                        </li>
                        <li>The winning team is the one who scored the most points. Points are calculated accordingly to the puzzles solved and their difficulty. Specifically:
                            <ul className="list-inside list-disc">
                                <li>Easy Puzzle - 1 point each</li>
                                <li>Normal Puzzle - 2 points each</li>
                                <li>Hard Puzzle - 4 points each</li>
                            </ul>
                        </li>
                        <li>Final Note: If the end-game password doesn&apos;t show you the number of letters in the word(s), it is because this in itself is a clue! Since it&apos;s a valuable clue, it would most probably be found in the most difficult path...</li>
                    </ol>
                </div>
                <div className="text-center mt-12 pb-6">
                    <Link href={'/'} className="text-[--theme-2] text-lg">Back to Main</Link>
                </div>
            </main>
        </>
    )
}