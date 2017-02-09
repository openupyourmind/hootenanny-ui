import * as d3 from 'd3';
import { t } from '../util/locale';
import { uiIntro } from './intro/index';
import { uiModal } from './modal';


export function uiSplash(context) {

    return function(selection) {
        if (context.storage('sawSplash'))
             return;

        context.storage('sawSplash', true);

        var modalSelection = uiModal(selection);

        modalSelection.select('.modal')
            .attr('class', 'modal-splash modal col6');

        var introModal = modalSelection.select('.content')
            .append('div')
            .attr('class', 'fillL');

        introModal
            .append('div')
            .attr('class','modal-section cf')
            .append('h3').text(t('splash.welcome'));

        introModal
            .append('div')
            .attr('class','modal-section')
            .append('p')
            .html(t('splash.text', {
                version: context.version,
                website: '<a href="http://ideditor.com/">ideditor.com</a>',
                github: '<a href="https://github.com/openstreetmap/iD">github.com</a>'
            }));

        var buttons = introModal
            .append('div')
            .attr('class', 'modal-actions cf');

        buttons
            .append('button')
            .attr('class', 'col12 start')
            .text(t('splash.start'))
            .on('click', modalSelection.close);

        modalSelection.select('button.close')
            .attr('class','hide');

    };
}
